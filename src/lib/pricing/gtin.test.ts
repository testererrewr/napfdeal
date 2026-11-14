import assert from "node:assert/strict";
import { test } from "node:test";
import { normalizeGtin, parseGtins } from "./gtin.ts";

test("valid EAN-13 is padded to 14 digits", () => {
  assert.equal(normalizeGtin("4006381333931"), "04006381333931");
});

test("UPC-A and its EAN-13 form are equal", () => {
  assert.equal(normalizeGtin("036000291452"), normalizeGtin("0036000291452"));
});

test("EAN-8", () => {
  assert.equal(normalizeGtin("96385074"), "00000096385074");
});

test("wrong check digit is rejected", () => {
  assert.equal(normalizeGtin("4006381333932"), null);
});

test("garbage is rejected", () => {
  for (const v of ["", "abc", "4.00638E+12", "0000000000000", "12345", undefined, null]) {
    assert.equal(normalizeGtin(v as string), null, String(v));
  }
});

test("spaces and dashes are tolerated", () => {
  assert.equal(normalizeGtin(" 4006381 333931 "), "04006381333931");
});

test("several GTINs in one field, deduplicated", () => {
  assert.deepEqual(parseGtins("4006381333931, 4006381333931;96385074", null), ["04006381333931", "00000096385074"]);
});
