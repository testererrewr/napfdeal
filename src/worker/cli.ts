/**
 * Small admin CLI inside the worker image.
 *   docker compose exec worker node dist/worker/cli.mjs refresh      → import all feeds now
 *   docker compose exec worker node dist/worker/cli.mjs status       → last imports + counts
 *   docker compose exec worker node dist/worker/cli.mjs stats        → recompute deal statistics
 *   docker compose exec worker node dist/worker/cli.mjs purge-test   → delete test data
 *   docker compose exec worker node dist/worker/cli.mjs test-history → 60 days of made-up history, TEST products only
 */
import { desc, sql } from "drizzle-orm";
import PgBoss from "pg-boss";
import { getDb, getSql } from "@/lib/db";
import { feedImportRun, matchReview } from "@/lib/db/schema";
import { purgeTestData } from "@/lib/feeds/purge";
import { recomputeStats } from "@/lib/stats";
import { FEED_QUEUES } from "./jobs/feeds";

async function count(query: "products" | "offers" | "active_offers" | "history"): Promise<number> {
  const q = getSql();
  const rows =
    query === "products"
      ? await q`select count(*)::int as n from product`
      : query === "offers"
        ? await q`select count(*)::int as n from offer`
        : query === "active_offers"
          ? await q`select count(*)::int as n from offer where active`
          : await q`select count(*)::int as n from price_history`;
  return Number(rows[0]?.n ?? 0);
}

async function status() {
  const db = getDb();
  const runs = await db.select().from(feedImportRun).orderBy(desc(feedImportRun.startedAt)).limit(10);
  console.log("Letzte Importe:");
  for (const r of runs) {
    console.log(
      `  #${r.id} ${r.startedAt.toISOString().slice(0, 16)} feed=${r.feedId ?? "-"} ${r.trigger.padEnd(6)} ${r.status.padEnd(7)} ` +
        `rows=${r.rowsTotal} neu=${r.offersCreated} preis=${r.priceChanges} prüfen=${r.reviewItems} fehler=${r.errors}` +
        (r.errorMessage ? `  (${r.errorMessage})` : ""),
    );
  }
  const reviews = await db
    .select({ kind: matchReview.kind, n: sql<number>`count(*)::int` })
    .from(matchReview)
    .where(sql`${matchReview.status} = 'open'`)
    .groupBy(matchReview.kind);
  console.log(`Produkte: ${await count("products")}`);
  console.log(`Angebote: ${await count("offers")} (aktiv: ${await count("active_offers")})`);
  console.log(`Preisverlauf-Einträge: ${await count("history")}`);
  console.log(`Offene Prüfungen: ${reviews.map((r) => `${r.kind}=${r.n}`).join(", ") || "keine"}`);
}

async function main() {
  const cmd = process.argv[2];
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL is not set");

  if (cmd === "refresh") {
    const boss = new PgBoss({ connectionString, schema: "pgboss" });
    await boss.start();
    await boss.createQueue(FEED_QUEUES.refresh);
    await boss.send(FEED_QUEUES.refresh, { trigger: "manual" });
    await boss.stop({ graceful: false });
    console.log("Import aller Feeds angestoßen. Fortschritt: docker compose logs -f worker");
  } else if (cmd === "status") {
    await status();
  } else if (cmd === "stats") {
    const r = await recomputeStats();
    console.log(`Statistik neu berechnet: ${r.products} Produkt/Land-Zeilen`);
  } else if (cmd === "test-history") {
    // Only for the preview with test data: fills product_daily for is_test products with a
    // deterministic, made-up 60-day history so charts and deal logic can be checked.
    const res = await getSql()`
      insert into product_daily (product_id, country, day, best_cents, offer_count)
      select ps.product_id, ps.country, (now() at time zone 'Europe/Vienna')::date - g.d,
             (ps.best_cents * (1.0 + 0.08 + 0.12 * ((ps.product_id * 7 + g.d * 13) % 10) / 10.0))::int, ps.offer_count
      from product_stats ps
      join product p on p.id = ps.product_id and p.is_test
      cross join generate_series(1, 60) as g(d)
      on conflict (product_id, country, day) do nothing
      returning product_id`;
    const r = await recomputeStats();
    console.log(`Test-Verlauf angelegt: ${res.length} Tageswerte (nur Testprodukte). Statistik: ${r.products} Zeilen.`);
  } else if (cmd === "purge-test") {
    const r = await purgeTestData();
    console.log(`Testdaten gelöscht: ${r.offers} Angebote, ${r.products} Produkte`);
  } else {
    console.log("Befehle: refresh | status | stats | test-history | purge-test");
    process.exitCode = 1;
  }
  await getSql().end();
}

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
