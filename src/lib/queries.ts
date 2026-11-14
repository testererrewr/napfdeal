/**
 * Read queries for the public pages. Only products with a current, usable offer in the
 * country appear in lists (they have a product_stats row). Test products are hidden
 * unless the operator's preview is active.
 */
import { and, asc, eq, gte, inArray, isNull, or, sql, type SQL } from "drizzle-orm";
import type { Country } from "@/lib/countries";
import { getDb } from "@/lib/db";
import { category, clickStat, network, offer, product, productDaily, productStats, shop } from "@/lib/db/schema";
import { evaluateDeal, evaluateDrop, type Saving } from "@/lib/pricing/deals";
import { addDays, todayKey } from "@/lib/format";

export const PAGE_SIZE = 48;

const listColumns = {
  productId: product.id,
  slug: product.slug,
  name: product.name,
  brand: product.brand,
  hasImage: sql<boolean>`${product.imageUrl} is not null`,
  sizeLabel: product.sizeLabel,
  sizeBaseUnit: product.sizeBaseUnit,
  categoryPath: category.path,
  bestCents: productStats.bestCents,
  bestUnitPriceCents: productStats.bestUnitPriceCents,
  offerCount: productStats.offerCount,
  checkedAt: productStats.checkedAt,
  median30Cents: productStats.median30Cents,
  days30: productStats.days30,
  prevBestCents: productStats.prevBestCents,
  prevBestDay: productStats.prevBestDay,
  min90Cents: productStats.min90Cents,
  lowestSinceDays: productStats.lowestSinceDays,
  historyDays: productStats.historyDays,
};

export type ListItem = Awaited<ReturnType<typeof listProducts>>[number];

function visibility(includeTest: boolean): SQL {
  return includeTest ? sql`true` : eq(product.isTest, false);
}

async function listProducts(opts: {
  country: Country;
  includeTest: boolean;
  where?: Array<SQL | undefined>;
  orderBy: SQL[];
  limit: number;
  offset?: number;
}) {
  return getDb()
    .select(listColumns)
    .from(productStats)
    .innerJoin(product, eq(product.id, productStats.productId))
    .leftJoin(category, eq(category.id, product.categoryId))
    .where(and(eq(productStats.country, opts.country), visibility(opts.includeTest), ...(opts.where ?? [])))
    .orderBy(...opts.orderBy)
    .limit(opts.limit)
    .offset(opts.offset ?? 0);
}

// ---------------------------------------------------------------------------
// Start page
// ---------------------------------------------------------------------------

export type SavingItem = { item: ListItem; saving: Saving };

/** Deals: clearly below the 30-day median (≥ 7 days of history). */
export async function getDeals(country: Country, includeTest: boolean, limit = 8): Promise<SavingItem[]> {
  const rows = await listProducts({
    country,
    includeTest,
    where: [
      gte(productStats.days30, 7),
      sql`${productStats.median30Cents} is not null`,
      sql`${productStats.bestCents} < ${productStats.median30Cents}`,
    ],
    orderBy: [sql`(${productStats.median30Cents} - ${productStats.bestCents})::float / ${productStats.median30Cents} desc`],
    limit: 300,
  });
  return rows
    .map((item) => ({ item, saving: evaluateDeal(item) }))
    .filter((x): x is SavingItem => x.saving !== null)
    .sort((a, b) => b.saving.savingPercent - a.saving.savingPercent || b.saving.savingCents - a.saving.savingCents)
    .slice(0, limit);
}

/** Biggest drops versus the previous day with data. */
export async function getDrops(country: Country, includeTest: boolean, limit = 8): Promise<SavingItem[]> {
  const rows = await listProducts({
    country,
    includeTest,
    where: [sql`${productStats.prevBestCents} is not null`, sql`${productStats.bestCents} < ${productStats.prevBestCents}`],
    orderBy: [sql`(${productStats.prevBestCents} - ${productStats.bestCents})::float / ${productStats.prevBestCents} desc`],
    limit: 300,
  });
  return rows
    .map((item) => ({ item, saving: evaluateDrop(item) }))
    .filter((x): x is SavingItem => x.saving !== null)
    .slice(0, limit);
}

/** Lowest price for at least 90 days. */
export async function getLows90(country: Country, includeTest: boolean, limit = 6): Promise<ListItem[]> {
  return listProducts({
    country,
    includeTest,
    where: [
      gte(productStats.historyDays, 90),
      or(isNull(productStats.lowestSinceDays), gte(productStats.lowestSinceDays, 90)),
    ],
    orderBy: [sql`${productStats.historyDays} desc`, asc(productStats.productId)],
    limit,
  });
}

/** Most clicked products of one animal in the last 30 days (anonymous click counts). */
export async function getPopular(country: Country, includeTest: boolean, animal: string, limit = 4): Promise<ListItem[]> {
  const since = addDays(todayKey(), -30);
  const top = await getDb()
    .select({ productId: offer.productId, clicks: sql<number>`sum(${clickStat.clicks})::int` })
    .from(clickStat)
    .innerJoin(offer, eq(offer.id, clickStat.offerId))
    .innerJoin(product, eq(product.id, offer.productId))
    .innerJoin(category, eq(category.id, product.categoryId))
    .where(
      and(
        eq(clickStat.country, country),
        gte(clickStat.day, since),
        or(eq(category.path, animal), sql`${category.path} like ${`${animal}/%`}`),
      ),
    )
    .groupBy(offer.productId)
    .orderBy(sql`sum(${clickStat.clicks}) desc`)
    .limit(limit);
  const ids = top.map((t) => t.productId).filter((id): id is number => id !== null);
  if (ids.length === 0) return [];
  const rows = await listProducts({ country, includeTest, where: [inArray(product.id, ids)], orderBy: [asc(product.id)], limit });
  return ids.map((id) => rows.find((r) => r.productId === id)).filter((r): r is ListItem => r !== undefined);
}

/** Number of products with a current offer in this country (for honest empty states). */
export async function countListed(country: Country, includeTest: boolean): Promise<number> {
  const rows = await getDb()
    .select({ n: sql<number>`count(*)::int` })
    .from(productStats)
    .innerJoin(product, eq(product.id, productStats.productId))
    .where(and(eq(productStats.country, country), visibility(includeTest)));
  return rows[0]?.n ?? 0;
}

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------

export type CategoryRow = { id: number; path: string; slug: string; name: string; note: string | null; parentId: number | null };

const categoryColumns = {
  id: category.id,
  path: category.path,
  slug: category.slug,
  name: category.name,
  note: category.note,
  parentId: category.parentId,
};

export async function getCategoryByPath(path: string): Promise<CategoryRow | null> {
  const rows = await getDb()
    .select(categoryColumns)
    .from(category)
    .where(and(eq(category.path, path), eq(category.enabled, true)))
    .limit(1);
  return rows[0] ?? null;
}

export async function getAnimals(): Promise<CategoryRow[]> {
  return getDb()
    .select(categoryColumns)
    .from(category)
    .where(and(isNull(category.parentId), eq(category.enabled, true)))
    .orderBy(asc(category.sortOrder));
}

export async function getChildren(parentId: number): Promise<CategoryRow[]> {
  return getDb()
    .select(categoryColumns)
    .from(category)
    .where(and(eq(category.parentId, parentId), eq(category.enabled, true)))
    .orderBy(asc(category.sortOrder));
}

/** id → path ("hund/trockenfutter") for all categories. */
export async function getCategoryPaths(): Promise<Map<number, string>> {
  const rows = await getDb().select({ id: category.id, path: category.path }).from(category);
  return new Map(rows.map((r): [number, string] => [r.id, r.path]));
}

/** Listed products per category id in this country. */
export async function countByCategory(country: Country, includeTest: boolean): Promise<Map<number, number>> {
  const rows = await getDb()
    .select({ categoryId: product.categoryId, n: sql<number>`count(*)::int` })
    .from(productStats)
    .innerJoin(product, eq(product.id, productStats.productId))
    .where(and(eq(productStats.country, country), visibility(includeTest)))
    .groupBy(product.categoryId);
  const m = new Map<number, number>();
  for (const r of rows) if (r.categoryId !== null) m.set(r.categoryId, r.n);
  return m;
}

export type SortKey = "grundpreis" | "preis";

export async function getCategoryProducts(opts: {
  country: Country;
  includeTest: boolean;
  categoryIds: number[];
  sort: SortKey;
  page: number;
}): Promise<{ items: ListItem[]; total: number }> {
  if (opts.categoryIds.length === 0) return { items: [], total: 0 };
  const where = [inArray(product.categoryId, opts.categoryIds)];
  const orderBy =
    opts.sort === "preis"
      ? [asc(productStats.bestCents), asc(product.id)]
      : [sql`${productStats.bestUnitPriceCents} asc nulls last`, asc(productStats.bestCents), asc(product.id)];
  const [items, totalRows] = await Promise.all([
    listProducts({
      country: opts.country,
      includeTest: opts.includeTest,
      where,
      orderBy,
      limit: PAGE_SIZE,
      offset: (opts.page - 1) * PAGE_SIZE,
    }),
    getDb()
      .select({ n: sql<number>`count(*)::int` })
      .from(productStats)
      .innerJoin(product, eq(product.id, productStats.productId))
      .where(and(eq(productStats.country, opts.country), visibility(opts.includeTest), ...where)),
  ]);
  return { items, total: totalRows[0]?.n ?? 0 };
}

// ---------------------------------------------------------------------------
// Product page
// ---------------------------------------------------------------------------

export async function getProductBySlug(slug: string, includeTest: boolean) {
  const rows = await getDb()
    .select({
      id: product.id,
      slug: product.slug,
      name: product.name,
      brand: product.brand,
      hasImage: sql<boolean>`${product.imageUrl} is not null`,
      sizeLabel: product.sizeLabel,
      sizeBaseUnit: product.sizeBaseUnit,
      sizeStatus: product.sizeStatus,
      categoryId: product.categoryId,
      categoryPath: category.path,
      categoryName: category.name,
      categoryParentId: category.parentId,
      updatedAt: product.updatedAt,
    })
    .from(product)
    .leftJoin(category, eq(category.id, product.categoryId))
    .where(and(eq(product.slug, slug), visibility(includeTest)))
    .limit(1);
  return rows[0] ?? null;
}

export type ProductDetail = NonNullable<Awaited<ReturnType<typeof getProductBySlug>>>;

export async function getGtins(productId: number): Promise<string[]> {
  const rows = await getDb().execute(sql`select gtin from product_gtin where product_id = ${productId} order by gtin`);
  return Array.from(rows as unknown as Array<{ gtin: string }>).map((r) => r.gtin);
}

export async function getOffers(productId: number, country: Country, includeTest: boolean) {
  return getDb()
    .select({
      id: offer.id,
      shopName: shop.name,
      priceCents: offer.priceCents,
      shippingCents: offer.shippingCents,
      totalCents: sql<number>`(${offer.priceCents} + coalesce(${offer.shippingCents}, 0))::int`,
      unitPriceCents: offer.unitPriceCents,
      available: offer.available,
      suspect: offer.priceSuspect,
      checkedAt: offer.checkedAt,
    })
    .from(offer)
    .innerJoin(shop, eq(shop.id, offer.shopId))
    .innerJoin(network, eq(network.id, shop.networkId))
    .where(
      and(
        eq(offer.productId, productId),
        eq(offer.country, country),
        eq(offer.active, true),
        eq(shop.enabled, true),
        includeTest ? sql`true` : eq(network.isTest, false),
      ),
    )
    .orderBy(sql`${offer.available} desc`, sql`(${offer.priceCents} + coalesce(${offer.shippingCents}, 0)) asc`, asc(offer.id));
}

export type OfferRow = Awaited<ReturnType<typeof getOffers>>[number];

export async function getStats(productId: number, country: Country) {
  const rows = await getDb()
    .select()
    .from(productStats)
    .where(and(eq(productStats.productId, productId), eq(productStats.country, country)))
    .limit(1);
  return rows[0] ?? null;
}

export async function getDailySeries(productId: number, country: Country, fromDay: string) {
  return getDb()
    .select({ day: productDaily.day, cents: productDaily.bestCents })
    .from(productDaily)
    .where(and(eq(productDaily.productId, productId), eq(productDaily.country, country), gte(productDaily.day, fromDay)))
    .orderBy(asc(productDaily.day));
}

/** For the sitemap: listed, non-test products per country. */
export async function getSitemapProducts(country: Country, limit = 45_000) {
  return getDb()
    .select({ slug: product.slug, categoryPath: category.path, updatedAt: productStats.computedAt })
    .from(productStats)
    .innerJoin(product, eq(product.id, productStats.productId))
    .leftJoin(category, eq(category.id, product.categoryId))
    .where(and(eq(productStats.country, country), eq(product.isTest, false)))
    .limit(limit);
}
