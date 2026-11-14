import assert from "node:assert/strict";
import { test } from "node:test";
import { slugify } from "./slug.ts";

test("slugify", () => {
  assert.equal(slugify("Royal Canin Mini Adult 8 kg"), "royal-canin-mini-adult-8-kg");
  assert.equal(slugify("Hühnchen & Möhre, 1,5 kg"), "huehnchen-moehre-1-5-kg");
  assert.equal(slugify("6 × 400 g Pâté"), "6-400-g-pate");
  assert.equal(slugify("!!!"), "produkt");
  const long = slugify("a".repeat(30) + " " + "b".repeat(30) + " " + "c".repeat(30));
  assert.ok(long.length <= 80 && !long.endsWith("-"), long);
});
