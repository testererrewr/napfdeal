/**
 * Watchlist totals. Pure module.
 * - cheapest per item: every product at its own cheapest shop (several orders)
 * - cheapest single shop: one shop that has everything; shipping counted once (highest shipping
 *   among the items – an approximation, free-shipping thresholds are not modelled)
 */

export type BasketOffer = {
  productId: number;
  shopId: number;
  shopName: string;
  priceCents: number;
  shippingCents: number | null;
};

export type SingleShopResult = {
  shopId: number;
  shopName: string;
  itemsCents: number;
  shippingCents: number | null;
  totalCents: number;
};

export function bestSingleShop(productIds: number[], offers: BasketOffer[]): SingleShopResult | null {
  if (productIds.length === 0) return null;
  const byShop = new Map<number, { name: string; items: Map<number, BasketOffer> }>();
  for (const o of offers) {
    const shop = byShop.get(o.shopId) ?? { name: o.shopName, items: new Map<number, BasketOffer>() };
    const prev = shop.items.get(o.productId);
    if (!prev || o.priceCents < prev.priceCents) shop.items.set(o.productId, o);
    byShop.set(o.shopId, shop);
  }

  let best: SingleShopResult | null = null;
  for (const [shopId, shop] of byShop) {
    if (!productIds.every((id) => shop.items.has(id))) continue;
    let items = 0;
    let shipping: number | null = 0;
    for (const id of productIds) {
      const o = shop.items.get(id) as BasketOffer;
      items += o.priceCents;
      if (o.shippingCents === null) shipping = null;
      else if (shipping !== null) shipping = Math.max(shipping, o.shippingCents);
    }
    const total = items + (shipping ?? 0);
    if (!best || total < best.totalCents) best = { shopId, shopName: shop.name, itemsCents: items, shippingCents: shipping, totalCents: total };
  }
  return best;
}

/** Sum of each product's best total (incl. its own shipping). Missing products are skipped and counted. */
export function sumOfBest(productIds: number[], bestTotals: Map<number, number>): { totalCents: number; missing: number } {
  let total = 0;
  let missing = 0;
  for (const id of productIds) {
    const v = bestTotals.get(id);
    if (v === undefined) missing++;
    else total += v;
  }
  return { totalCents: total, missing };
}
