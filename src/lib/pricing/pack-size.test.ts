import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { extractSizes, parsePackSize, unitPriceCents } from "./pack-size.ts";

function okTotal(feed: string | null, title: string) {
  const r = parsePackSize(feed, title);
  assert.equal(r.status, "ok", `expected ok for "${title}", got ${JSON.stringify(r)}`);
  return r.status === "ok" ? r.size : null!;
}

describe("parsePackSize – titles", () => {
  test("single kg", () => {
    const s = okTotal(null, "Royal Canin Mini Adult 8 kg");
    assert.equal(s.total, 8);
    assert.equal(s.baseUnit, "kg");
    assert.equal(s.label, "8 kg");
  });

  test("decimal comma", () => {
    assert.equal(okTotal(null, "Trockenfutter Huhn 1,5 kg").total, 1.5);
  });

  test("grams without space", () => {
    assert.equal(okTotal(null, "Snack Ente 400g").total, 0.4);
  });

  test("multipack 6 x 400 g", () => {
    const s = okTotal(null, "Nassfutter Rind 6 x 400 g");
    assert.equal(s.count, 6);
    assert.equal(s.amount, 400);
    assert.equal(s.total, 2.4);
    assert.equal(s.label, "6 × 400 g");
  });

  test("multipack variants: 12x85g, 24 × 85 g, 2*12 kg", () => {
    assert.equal(okTotal(null, "Katzenfutter 12x85g").total, 1.02);
    assert.equal(okTotal(null, "Katzenfutter 24 × 85 g Pouch").total, 2.04);
    assert.equal(okTotal(null, "Sparpaket 2*12 kg").total, 24);
  });

  test("multipack plus repeated item size counts once", () => {
    // "6 x 400 g" and nothing else → ok
    assert.equal(okTotal(null, "Dose 400 g – 6 x 400 g").total, 2.4);
  });

  test("litres and millilitres", () => {
    const s = okTotal(null, "Aquarium Wasseraufbereiter 500 ml");
    assert.equal(s.total, 0.5);
    assert.equal(s.baseUnit, "l");
    assert.equal(okTotal(null, "Katzenstreu Bentonit 10 l").total, 10);
    assert.equal(okTotal(null, "Einstreu 60 Liter").total, 60);
  });

  test("pieces", () => {
    const s = okTotal(null, "Kauknochen 24 Stück");
    assert.equal(s.baseUnit, "stk");
    assert.equal(s.total, 24);
    assert.equal(okTotal(null, "Zeckenschutz 3 Stk.").total, 3);
  });

  test("weight wins over pieces", () => {
    const s = okTotal(null, "Dentasticks 28 Stück 720 g");
    assert.equal(s.baseUnit, "kg");
    assert.equal(s.total, 0.72);
  });

  test("animal weight ranges are not pack sizes", () => {
    assert.equal(parsePackSize(null, "Geschirr für Hunde 10-25 kg").status, "none");
    assert.equal(parsePackSize(null, "Zeckenhalsband für Hunde bis 8 kg").status, "none");
    assert.equal(okTotal(null, "Trockenfutter für Hunde 10–25 kg, 12 kg Sack").total, 12);
  });

  test("two different sizes → review", () => {
    const r = parsePackSize(null, "Trockenfutter 12 kg + 2 kg gratis");
    assert.equal(r.status, "review");
    if (r.status === "review") assert.equal(r.candidates.length, 2);
  });

  test("no size → none", () => {
    assert.equal(parsePackSize(null, "Kratzbaum Deluxe grau").status, "none");
  });

  test("does not read model numbers like 'Ball XL' or units inside words", () => {
    assert.equal(parsePackSize(null, "Spielball 7 glow").status, "none");
    assert.equal(parsePackSize(null, "Leine 2 lang").status, "none");
  });
});

describe("parsePackSize – feed measure first", () => {
  test("feed measure wins over title", () => {
    const r = parsePackSize("12kg", "Hundefutter Lamm 15 kg");
    assert.equal(r.status, "ok");
    if (r.status === "ok") {
      assert.equal(r.source, "feed");
      assert.equal(r.size.total, 12);
    }
  });

  test("empty feed measure falls back to title", () => {
    const r = parsePackSize("  ", "Hundefutter Lamm 15 kg");
    assert.equal(r.status, "ok");
    if (r.status === "ok") assert.equal(r.source, "title");
  });
});

describe("unitPriceCents", () => {
  test("per kg", () => {
    const s = okTotal(null, "Nassfutter 6 x 400 g");
    // 11,99 € for 2,4 kg = 5,00 €/kg (4,9958 → 500)
    assert.equal(unitPriceCents(1199, s), 500);
  });
});

describe("extractSizes", () => {
  test("dedupes identical sizes", () => {
    assert.equal(extractSizes("12 kg Sack (12kg)").length, 1);
  });
});
