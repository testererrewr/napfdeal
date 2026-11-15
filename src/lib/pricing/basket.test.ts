import assert from "node:assert/strict";
import { test } from "node:test";
import { bestSingleShop, sumOfBest, type BasketOffer } from "./basket.ts";

const o = (productId: number, shopId: number, priceCents: number, shippingCents: number | null = 495): BasketOffer => ({
  productId,
  shopId,
  shopName: `Shop ${shopId}`,
  priceCents,
  shippingCents,
});

test("single shop must carry every product; shipping counted once", () => {
  const r = bestSingleShop([1, 2], [o(1, 10, 1000), o(2, 10, 2000), o(1, 20, 900), o(2, 30, 1500)]);
  assert.deepEqual(r, { shopId: 10, shopName: "Shop 10", itemsCents: 3000, shippingCents: 495, totalCents: 3495 });
});

test("picks the cheaper of two complete shops", () => {
  const r = bestSingleShop([1, 2], [o(1, 10, 1000), o(2, 10, 2000), o(1, 20, 1100, 0), o(2, 20, 2000, 0)]);
  assert.equal(r?.shopId, 20);
  assert.equal(r?.totalCents, 3100);
});

test("unknown shipping stays unknown", () => {
  const r = bestSingleShop([1], [o(1, 10, 1000, null)]);
  assert.equal(r?.shippingCents, null);
  assert.equal(r?.totalCents, 1000);
});

test("no complete shop → null", () => {
  assert.equal(bestSingleShop([1, 2], [o(1, 10, 1000), o(2, 20, 1000)]), null);
  assert.equal(bestSingleShop([], []), null);
});

test("sum of best", () => {
  assert.deepEqual(sumOfBest([1, 2, 3], new Map([[1, 500], [2, 700]])), { totalCents: 1200, missing: 1 });
});
