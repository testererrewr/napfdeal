import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { decidePriceChange, needsDailyAnchor } from "./price-change.ts";

const base = { priceCents: 5000, shippingCents: 0, available: true, suspect: false };

describe("decidePriceChange", () => {
  test("first observation", () => {
    const d = decidePriceChange(null, { priceCents: 5000, shippingCents: 0, available: true });
    assert.equal(d.changed, true);
    assert.equal(d.suspect, false);
  });

  test("unchanged", () => {
    const d = decidePriceChange(base, { priceCents: 5000, shippingCents: 0, available: true });
    assert.equal(d.changed, false);
    assert.equal(d.priceChanged, false);
  });

  test("normal drop", () => {
    const d = decidePriceChange(base, { priceCents: 4500, shippingCents: 0, available: true });
    assert.equal(d.changed, true);
    assert.equal(d.suspect, false);
    assert.equal(d.totalChangeRatio, -0.1);
  });

  test("-80 % in one step is suspect", () => {
    const d = decidePriceChange(base, { priceCents: 1000, shippingCents: 0, available: true });
    assert.equal(d.suspect, true);
  });

  test("next import with same price confirms the suspect price", () => {
    const d = decidePriceChange(
      { ...base, priceCents: 1000, suspect: true },
      { priceCents: 1000, shippingCents: 0, available: true },
    );
    assert.equal(d.suspect, false);
    assert.equal(d.confirmsSuspect, true);
  });

  test("suspect price reverting is not a confirmation", () => {
    const d = decidePriceChange(
      { ...base, priceCents: 1000, suspect: true },
      { priceCents: 5000, shippingCents: 0, available: true },
    );
    assert.equal(d.suspect, false);
    assert.equal(d.confirmsSuspect, false);
    assert.equal(d.priceChanged, true);
  });

  test("shipping counts towards the total", () => {
    const d = decidePriceChange(
      { ...base, shippingCents: 495 },
      { priceCents: 5000, shippingCents: 0, available: true },
    );
    assert.equal(d.priceChanged, true);
    assert.ok(d.totalChangeRatio < 0);
  });

  test("availability change alone writes history but is no price change", () => {
    const d = decidePriceChange(base, { priceCents: 5000, shippingCents: 0, available: false });
    assert.equal(d.changed, true);
    assert.equal(d.priceChanged, false);
  });
});

describe("needsDailyAnchor", () => {
  const tz = "Europe/Vienna";
  test("no history → due", () => assert.equal(needsDailyAnchor(null, new Date(), tz), true));
  test("same Vienna day → not due", () => {
    assert.equal(needsDailyAnchor(new Date("2026-11-14T05:30:00Z"), new Date("2026-11-14T16:30:00Z"), tz), false);
  });
  test("UTC same day but Vienna next day → due", () => {
    // 22:30 UTC = 23:30 Vienna (14th); 23:30 UTC = 00:30 Vienna (15th)
    assert.equal(needsDailyAnchor(new Date("2026-11-14T22:30:00Z"), new Date("2026-11-14T23:30:00Z"), tz), true);
  });
});
