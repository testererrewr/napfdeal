/**
 * Feed import pipeline: network-agnostic. Takes normalized offers from a FeedAdapter and
 *  - upserts shop / feed / offer,
 *  - assigns offers to products (GTIN first; without GTIN only suggestions → match_review),
 *  - computes pack size + unit price,
 *  - writes price history (on change + one daily anchor),
 *  - flags outliers (big one-step drops) until confirmed,
 *  - deactivates offers that disappeared from the feed.
 * One broken row never stops the feed; one broken feed never stops the others (see jobs).
 */
import { and, eq, gt, inArray, ne, sql } from "drizzle-orm";
import { loadCategoryIds } from "@/lib/catalog";
import { getDb } from "@/lib/db";
import { feed, feedImportRun, matchReview, network, offer, priceHistory, product, productGtin, shop } from "@/lib/db/schema";
import { classifyAnimal, classifySubcategory, type SubcategorySlug } from "@/lib/pricing/classify";
import { parseGtins } from "@/lib/pricing/gtin";
import { parsePackSize, type PackSizeResult } from "@/lib/pricing/pack-size";
import { decidePriceChange, needsDailyAnchor } from "@/lib/pricing/price-change";
import { matchScore, normalizeBrand, SUGGESTION_THRESHOLD } from "@/lib/pricing/similarity";
import { getSetting } from "@/lib/settings";
import { slugify } from "@/lib/slug";
import type { FeedAdapter, NormalizedOffer, RemoteFeed } from "./types";

const TZ = process.env.JOB_TIMEZONE ?? "Europe/Vienna";

/** Awin allows max. 5 downloads of the same feed per hour; we apply this to every network. */
export const MAX_DOWNLOADS_PER_FEED_PER_HOUR = 5;

/** Below this share of previously active offers we assume a broken download and keep old offers. */
const MIN_ROWS_SHARE_FOR_DEACTIVATION = 0.5;

/** Products where a missing pack size needs review (unit price matters most here). */
const FOOD_SUBS: ReadonlySet<SubcategorySlug> = new Set(["trockenfutter", "nassfutter", "snacks", "streu"]);
/** Durable goods: no unit price even if the title contains a volume or weight. */
const NO_UNIT_PRICE_SUBS: ReadonlySet<SubcategorySlug> = new Set(["zubehoer", "spielzeug"]);

export type ImportTrigger = "full" | "check" | "manual";

export type ImportSummary = {
  runId: number | null;
  status: "ok" | "failed" | "skipped";
  rowsTotal: number;
  rowsSkipped: number;
  offersCreated: number;
  offersUpdated: number;
  offersDeactivated: number;
  productsCreated: number;
  priceChanges: number;
  suspects: number;
  reviewItems: number;
  errors: number;
  errorMessage?: string;
};

type ExistingOffer = {
  id: number;
  productId: number | null;
  priceCents: number;
  shippingCents: number | null;
  available: boolean;
  priceSuspect: boolean;
  lastHistoryAt: Date | null;
};

type ProductSize = { sizeTotal: number | null; sizeStatus: string };

// ---------------------------------------------------------------------------
// Network / shop / feed bookkeeping
// ---------------------------------------------------------------------------

export async function ensureNetwork(adapter: Pick<FeedAdapter, "network" | "networkName" | "isTest">): Promise<number> {
  const rows = await getDb()
    .insert(network)
    .values({ slug: adapter.network, name: adapter.networkName, isTest: adapter.isTest })
    .onConflictDoUpdate({ target: network.slug, set: { name: adapter.networkName, isTest: adapter.isTest } })
    .returning({ id: network.id });
  return rows[0]!.id;
}

export async function upsertFeed(networkId: number, remote: RemoteFeed) {
  const db = getDb();
  const shopRows = await db
    .insert(shop)
    .values({ networkId, externalId: remote.shopExternalId, name: remote.shopName, country: remote.country })
    .onConflictDoUpdate({
      target: [shop.networkId, shop.externalId, shop.country],
      set: { name: remote.shopName },
    })
    .returning({ id: shop.id, enabled: shop.enabled });
  const shopRow = shopRows[0]!;

  const feedRows = await db
    .insert(feed)
    .values({
      networkId,
      shopId: shopRow.id,
      externalId: remote.externalId,
      name: remote.name,
      country: remote.country,
      language: remote.language,
      remoteVersion: remote.remoteVersion,
    })
    .onConflictDoUpdate({
      target: [feed.networkId, feed.externalId],
      set: {
        shopId: shopRow.id,
        name: remote.name,
        country: remote.country,
        language: remote.language,
        remoteVersion: remote.remoteVersion,
      },
    })
    .returning({ id: feed.id, enabled: feed.enabled, importedVersion: feed.importedVersion });
  const feedRow = feedRows[0]!;

  return {
    shopId: shopRow.id,
    feedId: feedRow.id,
    enabled: shopRow.enabled && feedRow.enabled,
    importedVersion: feedRow.importedVersion,
  };
}

async function downloadsInLastHour(feedId: number, now: Date): Promise<number> {
  const since = new Date(now.getTime() - 60 * 60 * 1000);
  const rows = await getDb()
    .select({ n: sql<number>`count(*)::int` })
    .from(feedImportRun)
    .where(and(eq(feedImportRun.feedId, feedId), gt(feedImportRun.startedAt, since), ne(feedImportRun.status, "skipped")));
  return rows[0]?.n ?? 0;
}

// ---------------------------------------------------------------------------
// Products
// ---------------------------------------------------------------------------

async function insertProductWithUniqueSlug(values: Omit<typeof product.$inferInsert, "slug">, baseSlug: string): Promise<number> {
  const db = getDb();
  for (let n = 1; n <= 100; n++) {
    const slug = n === 1 ? baseSlug : `${baseSlug}-${n}`;
    const rows = await db
      .insert(product)
      .values({ ...values, slug })
      .onConflictDoNothing({ target: product.slug })
      .returning({ id: product.id });
    if (rows[0]) return rows[0].id;
  }
  throw new Error(`could not find a free slug for ${baseSlug}`);
}

type Ctx = {
  isTest: boolean;
  categoryIds: Map<string, number>;
  productSizes: Map<number, ProductSize>;
  summary: ImportSummary;
};

async function createProduct(o: NormalizedOffer, gtins: string[], parsedPack: PackSizeResult, ctx: Ctx): Promise<number> {
  const db = getDb();
  const animal = classifyAnimal(o.feedCategory, o.title);
  const sub = classifySubcategory(o.feedCategory, o.title);
  // A bowl "1,2 l" or a toy "500 g" has no meaningful unit price – only consumables get one.
  const pack: PackSizeResult = sub !== null && NO_UNIT_PRICE_SUBS.has(sub) ? { status: "none" } : parsedPack;
  const categoryPath = animal && sub ? `${animal}/${sub}` : animal;
  const categoryId = categoryPath ? (ctx.categoryIds.get(categoryPath) ?? null) : null;
  const categoryStatus = animal && sub ? "auto" : "review";

  const size =
    pack.status === "ok"
      ? {
          sizeCount: pack.size.count,
          sizeAmount: pack.size.amount,
          sizeUnit: pack.size.unit,
          sizeTotal: pack.size.total,
          sizeBaseUnit: pack.size.baseUnit,
          sizeLabel: pack.size.label,
          sizeSource: pack.source,
          sizeStatus: "ok",
        }
      : { sizeStatus: pack.status };

  const productId = await insertProductWithUniqueSlug(
    {
      name: o.title,
      brand: o.brand,
      brandNorm: normalizeBrand(o.brand) || null,
      categoryId,
      categoryStatus,
      imageUrl: o.imageUrl,
      isTest: ctx.isTest,
      ...size,
    },
    slugify(o.title),
  );
  ctx.summary.productsCreated++;
  ctx.productSizes.set(productId, {
    sizeTotal: pack.status === "ok" ? pack.size.total : null,
    sizeStatus: pack.status === "ok" ? "ok" : pack.status,
  });

  if (gtins.length > 0) {
    await db
      .insert(productGtin)
      .values(gtins.map((gtin) => ({ gtin, productId })))
      .onConflictDoNothing();
  }

  if (categoryStatus === "review") {
    await addReview({ kind: "category", productId, details: { animal, sub, feedCategory: o.feedCategory } }, ctx);
  }
  const isFood = sub !== null && FOOD_SUBS.has(sub);
  if (pack.status === "review" || (pack.status === "none" && isFood)) {
    await addReview(
      {
        kind: "size",
        productId,
        details: pack.status === "review" ? { reason: pack.reason, candidates: pack.candidates } : { reason: "no size found" },
      },
      ctx,
    );
  }
  return productId;
}

async function addReview(values: typeof matchReview.$inferInsert, ctx: Ctx): Promise<void> {
  // Partial unique indexes prevent duplicate open items; conflict → already queued.
  const rows = await getDb().insert(matchReview).values(values).onConflictDoNothing().returning({ id: matchReview.id });
  if (rows[0]) ctx.summary.reviewItems++;
}

/**
 * Finds or creates the product for an offer that has none yet.
 * Returns null if the offer must wait for an admin decision.
 */
async function resolveProduct(offerId: number, o: NormalizedOffer, gtins: string[], ctx: Ctx): Promise<number | null> {
  const db = getDb();
  const pack = parsePackSize(o.sizeMeasure, o.title);

  if (gtins.length > 0) {
    const hits = await db
      .selectDistinct({ productId: productGtin.productId })
      .from(productGtin)
      .where(inArray(productGtin.gtin, gtins));

    if (hits.length === 1) {
      const productId = hits[0]!.productId;
      // Learn additional GTINs of the same item (other pack prints, UPC vs EAN).
      await db
        .insert(productGtin)
        .values(gtins.map((gtin) => ({ gtin, productId })))
        .onConflictDoNothing();
      return productId;
    }
    if (hits.length > 1) {
      await addReview(
        { kind: "match", offerId, details: { reason: "GTINs belong to several products", productIds: hits.map((h) => h.productId) } },
        ctx,
      );
      return null;
    }
    return createProduct(o, gtins, pack, ctx);
  }

  // No GTIN: only suggest, never merge automatically.
  const brandNorm = normalizeBrand(o.brand);
  if (brandNorm) {
    const candidates = await db
      .select({
        id: product.id,
        name: product.name,
        brand: product.brand,
        sizeTotal: product.sizeTotal,
        sizeBaseUnit: product.sizeBaseUnit,
      })
      .from(product)
      .where(eq(product.brandNorm, brandNorm))
      .limit(500);

    const me = {
      name: o.title,
      brand: o.brand,
      sizeTotal: pack.status === "ok" ? pack.size.total : null,
      sizeUnit: pack.status === "ok" ? pack.size.baseUnit : null,
    };
    let best: { id: number; score: number } | null = null;
    for (const c of candidates) {
      const score = matchScore(me, { name: c.name, brand: c.brand, sizeTotal: c.sizeTotal, sizeUnit: c.sizeBaseUnit });
      if (!best || score > best.score) best = { id: c.id, score };
    }
    if (best && best.score >= SUGGESTION_THRESHOLD) {
      await addReview({ kind: "match", offerId, candidateProductId: best.id, score: best.score, details: { title: o.title } }, ctx);
      return null;
    }
  }
  return createProduct(o, [], pack, ctx);
}

async function getProductSize(productId: number, ctx: Ctx): Promise<ProductSize> {
  const cached = ctx.productSizes.get(productId);
  if (cached) return cached;
  const rows = await getDb()
    .select({ sizeTotal: product.sizeTotal, sizeStatus: product.sizeStatus })
    .from(product)
    .where(eq(product.id, productId))
    .limit(1);
  const size = rows[0] ?? { sizeTotal: null, sizeStatus: "none" };
  ctx.productSizes.set(productId, size);
  return size;
}

// ---------------------------------------------------------------------------
// Offer rows
// ---------------------------------------------------------------------------

function isValid(o: NormalizedOffer): boolean {
  return (
    o.externalId.trim() !== "" &&
    o.title.trim() !== "" &&
    (o.currency === "" || o.currency.toUpperCase() === "EUR") &&
    Number.isInteger(o.priceCents) &&
    o.priceCents > 0 &&
    /^https:\/\//.test(o.deeplink)
  );
}

async function processOffer(
  o: NormalizedOffer,
  ctx: Ctx & { shopId: number; feedId: number; country: string; now: Date; suspectRatio: number; existing: Map<string, ExistingOffer> },
): Promise<void> {
  const db = getDb();
  const { now } = ctx;
  const gtins = parseGtins(...o.gtinFields);
  const prev = ctx.existing.get(o.externalId) ?? null;

  const decision = decidePriceChange(
    prev
      ? { priceCents: prev.priceCents, shippingCents: prev.shippingCents, available: prev.available, suspect: prev.priceSuspect }
      : null,
    { priceCents: o.priceCents, shippingCents: o.shippingCents, available: o.available },
    ctx.suspectRatio,
  );

  const common = {
    feedId: ctx.feedId,
    country: ctx.country,
    title: o.title,
    brand: o.brand,
    gtins,
    priceCents: o.priceCents,
    shippingCents: o.shippingCents,
    currency: "EUR",
    available: o.available,
    deeplink: o.deeplink,
    imageUrl: o.imageUrl,
    feedCategory: o.feedCategory,
    active: true,
    priceSuspect: decision.suspect,
    checkedAt: now,
    lastSeenAt: now,
  };

  const unitPriceFor = async (productId: number): Promise<number | null> => {
    const size = await getProductSize(productId, ctx);
    return size.sizeStatus === "ok" && size.sizeTotal ? Math.round(o.priceCents / size.sizeTotal) : null;
  };

  let offerId: number;
  const knownProductId = prev?.productId ?? null;

  if (!prev) {
    const rows = await db
      .insert(offer)
      .values({ ...common, shopId: ctx.shopId, externalId: o.externalId, priceChangedAt: now, firstSeenAt: now })
      .returning({ id: offer.id });
    offerId = rows[0]!.id;
    ctx.summary.offersCreated++;
  } else {
    offerId = prev.id;
    const unitPrice = knownProductId !== null ? await unitPriceFor(knownProductId) : null;
    await db
      .update(offer)
      .set({ ...common, unitPriceCents: unitPrice, ...(decision.priceChanged ? { priceChangedAt: now } : {}) })
      .where(eq(offer.id, offerId));
    ctx.summary.offersUpdated++;
    if (decision.priceChanged) ctx.summary.priceChanges++;
  }
  if (decision.suspect) ctx.summary.suspects++;

  // New or still unassigned offer: find/create its product (or queue it for review).
  if (knownProductId === null) {
    const productId = await resolveProduct(offerId, o, gtins, ctx);
    if (productId !== null) {
      await db
        .update(offer)
        .set({ productId, unitPriceCents: await unitPriceFor(productId) })
        .where(eq(offer.id, offerId));
    }
  }

  // Price history: on change, or one anchor per calendar day.
  let wroteHistory = false;
  if (decision.changed) {
    await db.insert(priceHistory).values({
      offerId,
      priceCents: o.priceCents,
      shippingCents: o.shippingCents,
      available: o.available,
      suspect: decision.suspect,
      kind: prev ? "change" : "first",
      recordedAt: now,
    });
    wroteHistory = true;
  } else if (needsDailyAnchor(prev?.lastHistoryAt ?? null, now, TZ)) {
    await db.insert(priceHistory).values({
      offerId,
      priceCents: o.priceCents,
      shippingCents: o.shippingCents,
      available: o.available,
      suspect: false,
      kind: "anchor",
      recordedAt: now,
    });
    wroteHistory = true;
  }
  if (decision.confirmsSuspect) {
    await db
      .update(priceHistory)
      .set({ suspect: false })
      .where(and(eq(priceHistory.offerId, offerId), eq(priceHistory.suspect, true)));
  }
  if (wroteHistory) {
    await db.update(offer).set({ lastHistoryAt: now }).where(eq(offer.id, offerId));
  }
}

// ---------------------------------------------------------------------------
// Feed run
// ---------------------------------------------------------------------------

function emptySummary(): ImportSummary {
  return {
    runId: null,
    status: "ok",
    rowsTotal: 0,
    rowsSkipped: 0,
    offersCreated: 0,
    offersUpdated: 0,
    offersDeactivated: 0,
    productsCreated: 0,
    priceChanges: 0,
    suspects: 0,
    reviewItems: 0,
    errors: 0,
  };
}

function shortError(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  return msg.slice(0, 500);
}

export async function importFeed(adapter: FeedAdapter, remote: RemoteFeed, trigger: ImportTrigger): Promise<ImportSummary> {
  const db = getDb();
  const now = new Date();
  const summary = emptySummary();

  const networkId = await ensureNetwork(adapter);
  const { shopId, feedId, enabled } = await upsertFeed(networkId, remote);

  if (!enabled) {
    summary.status = "skipped";
    summary.errorMessage = "shop or feed disabled";
    return summary;
  }

  if ((await downloadsInLastHour(feedId, now)) >= MAX_DOWNLOADS_PER_FEED_PER_HOUR) {
    const rows = await db
      .insert(feedImportRun)
      .values({ networkId, feedId, trigger, status: "skipped", finishedAt: now, errorMessage: "download limit per hour reached" })
      .returning({ id: feedImportRun.id });
    return { ...summary, runId: rows[0]!.id, status: "skipped", errorMessage: "download limit per hour reached" };
  }

  const runRows = await db
    .insert(feedImportRun)
    .values({ networkId, feedId, trigger, status: "running", startedAt: now })
    .returning({ id: feedImportRun.id });
  summary.runId = runRows[0]!.id;

  try {
    const existingRows = await db
      .select({
        id: offer.id,
        externalId: offer.externalId,
        productId: offer.productId,
        priceCents: offer.priceCents,
        shippingCents: offer.shippingCents,
        available: offer.available,
        priceSuspect: offer.priceSuspect,
        lastHistoryAt: offer.lastHistoryAt,
        active: offer.active,
      })
      .from(offer)
      .where(eq(offer.shopId, shopId));
    const existing = new Map<string, ExistingOffer>(existingRows.map((r): [string, ExistingOffer] => [r.externalId, r]));
    const previouslyActive = existingRows.filter((r) => r.active).length;

    const ctx = {
      isTest: adapter.isTest,
      categoryIds: await loadCategoryIds(),
      productSizes: new Map<number, ProductSize>(),
      summary,
      shopId,
      feedId,
      country: remote.country,
      now,
      suspectRatio: await getSetting("pricing.suspectDropRatio"),
      existing,
    };

    const seen = new Set<string>();
    for await (const o of adapter.fetchOffers(remote)) {
      summary.rowsTotal++;
      if (!isValid(o) || seen.has(o.externalId)) {
        summary.rowsSkipped++;
        continue;
      }
      seen.add(o.externalId);
      try {
        await processOffer(o, ctx);
      } catch (err) {
        summary.errors++;
        if (!summary.errorMessage) summary.errorMessage = `row ${o.externalId}: ${shortError(err)}`;
      }
    }

    // Offers missing from this import are gone – unless the download looks broken.
    const imported = seen.size;
    if (imported >= previouslyActive * MIN_ROWS_SHARE_FOR_DEACTIVATION) {
      const gone = await db.execute(sql`
        with gone as (
          update ${offer} set active = false, available = false
          where ${offer.shopId} = ${shopId} and ${offer.active} = true and ${offer.lastSeenAt} < ${now}
          returning id, price_cents, shipping_cents
        )
        insert into ${priceHistory} (offer_id, price_cents, shipping_cents, available, suspect, kind, recorded_at)
        select id, price_cents, shipping_cents, false, false, 'gone', ${now} from gone
        returning offer_id
      `);
      summary.offersDeactivated = Array.from(gone as unknown as unknown[]).length;
    } else {
      summary.errors++;
      summary.errorMessage ??= `only ${imported} of ${previouslyActive} offers in download – kept existing offers active`;
    }

    await db
      .update(feed)
      .set({ lastImportAt: now, importedVersion: remote.remoteVersion })
      .where(eq(feed.id, feedId));
  } catch (err) {
    summary.status = "failed";
    summary.errors++;
    summary.errorMessage = shortError(err);
  }

  await db
    .update(feedImportRun)
    .set({
      status: summary.status,
      finishedAt: new Date(),
      rowsTotal: summary.rowsTotal,
      rowsSkipped: summary.rowsSkipped,
      offersCreated: summary.offersCreated,
      offersUpdated: summary.offersUpdated,
      offersDeactivated: summary.offersDeactivated,
      productsCreated: summary.productsCreated,
      priceChanges: summary.priceChanges,
      suspects: summary.suspects,
      reviewItems: summary.reviewItems,
      errors: summary.errors,
      errorMessage: summary.errorMessage ?? null,
    })
    .where(eq(feedImportRun.id, summary.runId));

  return summary;
}
