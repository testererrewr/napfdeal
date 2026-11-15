import { and, asc, count, desc, eq, inArray } from "drizzle-orm";
import type { Country } from "@/lib/countries";
import { getDb } from "@/lib/db";
import { account, alert, category, network, offer, product, productStats, shop, watchlist, watchlistItem } from "@/lib/db/schema";

const alertColumns = {
  id: alert.id,
  productId: alert.productId,
  productName: product.name,
  productSlug: product.slug,
  categoryPath: category.path,
  country: alert.country,
  kind: alert.kind,
  targetCents: alert.targetCents,
  includeShipping: alert.includeShipping,
  minDropPercent: alert.minDropPercent,
  minDropCents: alert.minDropCents,
  backInStock: alert.backInStock,
  digest: alert.digest,
  channels: alert.channels,
  status: alert.status,
  lastNotifiedAt: alert.lastNotifiedAt,
  createdAt: alert.createdAt,
};

export type AlertRow = Awaited<ReturnType<typeof getUserAlerts>>[number];

export async function getUserAlerts(userId: string) {
  return getDb()
    .select(alertColumns)
    .from(alert)
    .innerJoin(product, eq(product.id, alert.productId))
    .leftJoin(category, eq(category.id, product.categoryId))
    .where(eq(alert.userId, userId))
    .orderBy(desc(alert.createdAt));
}

export async function getGuestAlerts(guestId: number) {
  return getDb()
    .select(alertColumns)
    .from(alert)
    .innerJoin(product, eq(product.id, alert.productId))
    .leftJoin(category, eq(category.id, product.categoryId))
    .where(eq(alert.guestId, guestId))
    .orderBy(desc(alert.createdAt));
}

export async function getLinkedProviders(userId: string): Promise<string[]> {
  const rows = await getDb().select({ providerId: account.providerId }).from(account).where(eq(account.userId, userId));
  return rows.map((r) => r.providerId);
}

export async function getUserWatchlists(userId: string) {
  return getDb()
    .select({ id: watchlist.id, name: watchlist.name, createdAt: watchlist.createdAt, items: count(watchlistItem.productId) })
    .from(watchlist)
    .leftJoin(watchlistItem, eq(watchlistItem.watchlistId, watchlist.id))
    .where(eq(watchlist.userId, userId))
    .groupBy(watchlist.id)
    .orderBy(asc(watchlist.createdAt));
}

export async function getWatchlist(userId: string, listId: number) {
  const rows = await getDb()
    .select({ id: watchlist.id, name: watchlist.name })
    .from(watchlist)
    .where(and(eq(watchlist.id, listId), eq(watchlist.userId, userId)))
    .limit(1);
  return rows[0] ?? null;
}

export async function getWatchlistItems(listId: number, country: Country, includeTest: boolean) {
  const db = getDb();
  const items = await db
    .select({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      isTest: product.isTest,
      sizeLabel: product.sizeLabel,
      sizeBaseUnit: product.sizeBaseUnit,
      categoryPath: category.path,
      addedAt: watchlistItem.addedAt,
    })
    .from(watchlistItem)
    .innerJoin(product, eq(product.id, watchlistItem.productId))
    .leftJoin(category, eq(category.id, product.categoryId))
    .where(eq(watchlistItem.watchlistId, listId))
    .orderBy(asc(watchlistItem.addedAt));
  const visible = items.filter((i) => includeTest || !i.isTest);
  const ids = visible.map((i) => i.productId);
  if (ids.length === 0) return { items: visible, stats: new Map<number, { bestCents: number; bestUnitPriceCents: number | null; checkedAt: Date }>(), offers: [] };

  const statsRows = await db
    .select({
      productId: productStats.productId,
      bestCents: productStats.bestCents,
      bestUnitPriceCents: productStats.bestUnitPriceCents,
      checkedAt: productStats.checkedAt,
    })
    .from(productStats)
    .where(and(eq(productStats.country, country), inArray(productStats.productId, ids)));

  const offers = await db
    .select({
      productId: offer.productId,
      shopId: shop.id,
      shopName: shop.name,
      priceCents: offer.priceCents,
      shippingCents: offer.shippingCents,
    })
    .from(offer)
    .innerJoin(shop, eq(shop.id, offer.shopId))
    .innerJoin(network, eq(network.id, shop.networkId))
    .where(
      and(
        inArray(offer.productId, ids),
        eq(offer.country, country),
        eq(offer.active, true),
        eq(offer.available, true),
        eq(offer.priceSuspect, false),
        eq(shop.enabled, true),
        ...(includeTest ? [] : [eq(network.isTest, false)]),
      ),
    );

  return {
    items: visible,
    stats: new Map(statsRows.map((r): [number, { bestCents: number; bestUnitPriceCents: number | null; checkedAt: Date }] => [r.productId, r])),
    offers: offers.filter((o): o is typeof o & { productId: number } => o.productId !== null),
  };
}

/** Lists of a user for the "Merken" select on product pages. */
export async function getListsForSelect(userId: string) {
  return getDb().select({ id: watchlist.id, name: watchlist.name }).from(watchlist).where(eq(watchlist.userId, userId)).orderBy(asc(watchlist.createdAt));
}
