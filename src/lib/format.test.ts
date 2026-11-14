import assert from "node:assert/strict";
import { test } from "node:test";
import { addDays, formatCheckedAt, formatShortDay, formatUnitPrice, relativeDay, todayKey } from "./format.ts";

const nbsp = (s: string | null) => (s ?? "").replace(/\s/g, " ");

test("unit price", () => {
  assert.equal(nbsp(formatUnitPrice(458, "kg")), "4,58 €/kg");
  assert.equal(nbsp(formatUnitPrice(42, "stk")), "0,42 €/Stück");
  assert.equal(formatUnitPrice(null, "kg"), null);
});

test("checked at in Vienna time", () => {
  // 04:34 UTC = 05:34 Vienna (CET)
  assert.equal(formatCheckedAt(new Date("2026-11-14T04:34:00Z")), "14.11.2026, 05:34 Uhr");
});

test("days", () => {
  assert.equal(formatShortDay("2026-11-02"), "2.11.");
  assert.equal(addDays("2026-11-30", 1), "2026-12-01");
  assert.equal(todayKey(new Date("2026-11-14T23:30:00Z")), "2026-11-15");
  assert.equal(relativeDay("2026-11-13", "2026-11-14"), "gestern");
  assert.equal(relativeDay("2026-11-10", "2026-11-14"), "am 10.11.");
});
