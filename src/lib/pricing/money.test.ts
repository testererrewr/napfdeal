import assert from "node:assert/strict";
import { test } from "node:test";
import { formatEuro, parseMoneyToCents } from "./money.ts";

test("parseMoneyToCents", () => {
  assert.equal(parseMoneyToCents("12.99"), 1299);
  assert.equal(parseMoneyToCents("12,99"), 1299);
  assert.equal(parseMoneyToCents("€ 4.95"), 495);
  assert.equal(parseMoneyToCents("1.234,56"), 123456);
  assert.equal(parseMoneyToCents("1,234.56"), 123456);
  assert.equal(parseMoneyToCents("0"), 0);
  assert.equal(parseMoneyToCents(""), null);
  assert.equal(parseMoneyToCents("abc"), null);
  assert.equal(parseMoneyToCents(null), null);
  assert.equal(parseMoneyToCents("0.1"), 10);
  assert.equal(parseMoneyToCents("19.999"), 2000);
});

test("formatEuro", () => {
  assert.equal(formatEuro(1299).replace(/\s/g, " "), "12,99 €");
});
