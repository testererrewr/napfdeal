/**
 * Background worker – separate process from the web app.
 * Uses pg-boss (job queue inside PostgreSQL, no Redis).
 *
 * Schedules (time zone JOB_TIMEZONE, default Europe/Vienna; editable via app_setting):
 *   feeds.refresh   full refresh of every feed        default "30 5,17 * * *"  (05:30 and 17:30)
 *   feeds.check     hourly: only feeds with new data  default "0 * * * *"
 *   system.heartbeat every 15 min: liveness log + re-apply schedules from settings
 */
import PgBoss from "pg-boss";
import { ensureSeedCategories } from "@/lib/catalog";
import { purgeTestData } from "@/lib/feeds/purge";
import { activeAdapters, isTestMode } from "@/lib/feeds/registry";
import { getSetting } from "@/lib/settings";
import { enqueueAllFeeds, enqueueChangedFeeds, FEED_QUEUES, type ImportJobData, runImportJob } from "./jobs/feeds";

const TZ = process.env.JOB_TIMEZONE ?? "Europe/Vienna";
const HEARTBEAT = "system.heartbeat";

async function applySchedules(boss: PgBoss): Promise<void> {
  // schedule() upserts, so calling it again picks up changed settings.
  await boss.schedule(FEED_QUEUES.refresh, await getSetting("jobs.fullRefreshCron"), { trigger: "full" }, { tz: TZ });
  await boss.schedule(FEED_QUEUES.check, await getSetting("jobs.feedCheckCron"), {}, { tz: TZ });
  await boss.schedule(HEARTBEAT, "*/15 * * * *", {}, { tz: TZ });
}

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL is not set");

  await ensureSeedCategories();

  if (!isTestMode()) {
    const purged = await purgeTestData();
    if (purged.offers > 0) console.log(`[worker] removed test data: ${purged.offers} offers, ${purged.products} products`);
  }

  const boss = new PgBoss({ connectionString, schema: "pgboss" });
  boss.on("error", (err) => console.error("[worker] pg-boss error:", err.message));
  await boss.start();

  for (const q of [HEARTBEAT, FEED_QUEUES.check, FEED_QUEUES.refresh, FEED_QUEUES.import]) {
    await boss.createQueue(q);
  }
  await applySchedules(boss);

  await boss.work(HEARTBEAT, async () => {
    await applySchedules(boss);
    console.log(`[worker] heartbeat ${new Date().toISOString()}`);
  });

  await boss.work(FEED_QUEUES.check, async () => {
    const n = await enqueueChangedFeeds(boss);
    if (n > 0) console.log(`[feeds] check: ${n} feed(s) with new data queued`);
  });

  await boss.work<{ trigger?: "full" | "manual" }>(FEED_QUEUES.refresh, async ([job]) => {
    const n = await enqueueAllFeeds(boss, job?.data?.trigger ?? "full");
    console.log(`[feeds] refresh: ${n} feed(s) queued`);
  });

  // One import at a time keeps DB load low and stays far below Awin's 5 concurrent downloads.
  await boss.work<ImportJobData>(FEED_QUEUES.import, async ([job]) => {
    if (job) await runImportJob(job.data);
  });

  const networks = activeAdapters().map((a) => a.network);
  console.log(
    `[worker] started (tz=${TZ}, networks: ${networks.length ? networks.join(", ") : "none configured"}${isTestMode() ? ", TEST MODE" : ""})`,
  );

  const shutdown = async (signal: string) => {
    console.log(`[worker] ${signal} received, stopping…`);
    await boss.stop({ graceful: true, timeout: 30_000 });
    process.exit(0);
  };
  process.on("SIGTERM", () => void shutdown("SIGTERM"));
  process.on("SIGINT", () => void shutdown("SIGINT"));
}

main().catch((err: unknown) => {
  console.error("[worker] fatal:", err instanceof Error ? err.message : err);
  process.exit(1);
});
