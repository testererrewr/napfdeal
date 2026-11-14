import assert from "node:assert/strict";
import { test } from "node:test";
import { matchScore, nameTokens, SUGGESTION_THRESHOLD } from "./similarity.ts";

test("tokens drop brand, sizes and generic words", () => {
  assert.deepEqual(nameTokens("Wolfsblut Wild Duck Adult 12 kg Trockenfutter", "Wolfsblut"), ["wild", "duck"]);
});

test("same product from two shops scores high", () => {
  const s = matchScore(
    { name: "Wolfsblut Wild Duck Adult 12kg", brand: "Wolfsblut", sizeTotal: 12, sizeUnit: "kg" },
    { name: "Wolfsblut - Wild Duck - Adult, 12 kg", brand: "WOLFSBLUT", sizeTotal: 12, sizeUnit: "kg" },
  );
  assert.ok(s >= SUGGESTION_THRESHOLD, `score ${s}`);
});

test("different brand → 0", () => {
  assert.equal(
    matchScore(
      { name: "Wild Duck 12 kg", brand: "Wolfsblut", sizeTotal: 12, sizeUnit: "kg" },
      { name: "Wild Duck 12 kg", brand: "Other", sizeTotal: 12, sizeUnit: "kg" },
    ),
    0,
  );
});

test("different size is penalised below threshold", () => {
  const s = matchScore(
    { name: "Wolfsblut Wild Duck 12 kg", brand: "Wolfsblut", sizeTotal: 12, sizeUnit: "kg" },
    { name: "Wolfsblut Wild Duck 2 kg", brand: "Wolfsblut", sizeTotal: 2, sizeUnit: "kg" },
  );
  assert.ok(s < SUGGESTION_THRESHOLD, `score ${s}`);
});

test("different variety scores low", () => {
  const s = matchScore(
    { name: "Wolfsblut Wild Duck 12 kg", brand: "Wolfsblut", sizeTotal: 12, sizeUnit: "kg" },
    { name: "Wolfsblut Grey Peak 12 kg", brand: "Wolfsblut", sizeTotal: 12, sizeUnit: "kg" },
  );
  assert.ok(s < SUGGESTION_THRESHOLD, `score ${s}`);
});
