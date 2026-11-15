import assert from "node:assert/strict";
import { test } from "node:test";
import { describeCondition, isPlausibleEmail, parseAlertInput } from "./alert-rules.ts";

const form = (o: Record<string, string>) => (k: string) => o[k] ?? null;

test("target alert", () => {
  const r = parseAlertInput(form({ productId: "12", country: "de", kind: "target", target: "39,90" }));
  assert.ok(r.ok);
  if (r.ok) {
    assert.equal(r.value.targetCents, 3990);
    assert.equal(r.value.includeShipping, true);
    assert.equal(describeCondition(r.value), "Gesamtpreis inkl. Versand höchstens 39,90 €");
  }
});

test("target needs a price", () => {
  const r = parseAlertInput(form({ productId: "12", country: "de", kind: "target", target: "abc" }));
  assert.equal(r.ok, false);
});

test("drop alert with defaults and back in stock", () => {
  const r = parseAlertInput(form({ productId: "1", country: "at", kind: "drop", backInStock: "1", includeShipping: "0" }));
  assert.ok(r.ok);
  if (r.ok) {
    assert.equal(r.value.minDropPercent, 3);
    assert.equal(r.value.minDropCents, 50);
    assert.equal(describeCondition(r.value), "Jede Preissenkung ab 3 % oder 0,50 € (ohne Versand), oder wenn es wieder lieferbar ist");
  }
});

test("drop alert custom thresholds and limits", () => {
  const r = parseAlertInput(form({ productId: "1", country: "de", kind: "drop", minDropPercent: "5,5", minDropEuro: "2" }));
  assert.ok(r.ok && r.value.minDropPercent === 5.5 && r.value.minDropCents === 200);
  assert.equal(parseAlertInput(form({ productId: "1", country: "de", kind: "drop", minDropPercent: "95" })).ok, false);
});

test("invalid product or country", () => {
  assert.equal(parseAlertInput(form({ productId: "x", country: "de" })).ok, false);
  assert.equal(parseAlertInput(form({ productId: "1", country: "ch", target: "1" })).ok, false);
});

test("email plausibility", () => {
  assert.equal(isPlausibleEmail("a@b.de"), true);
  assert.equal(isPlausibleEmail("a@b"), false);
  assert.equal(isPlausibleEmail("a b@c.de"), false);
});

test("unchecked shipping checkbox from the form", () => {
  const r = parseAlertInput(form({ productId: "1", country: "de", kind: "target", target: "10", includeShippingField: "1" }));
  assert.ok(r.ok && r.value.includeShipping === false);
  const r2 = parseAlertInput(form({ productId: "1", country: "de", kind: "target", target: "10", includeShippingField: "1", includeShipping: "1" }));
  assert.ok(r2.ok && r2.value.includeShipping === true);
});
