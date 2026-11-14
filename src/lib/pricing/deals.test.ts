import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { chartGeometry, evaluateDeal, evaluateDrop, isLow90, lowestSince, median, type StatsLike } from "./deals.ts";

const base: StatsLike = {
  bestCents: 4000,
  median30Cents: 5000,
  days30: 20,
  prevBestCents: 4500,
  min90Cents: 4200,
  lowestSinceDays: null,
  historyDays: 60,
};

describe("evaluateDeal", () => {
  test("20 % below median is a deal", () => {
    assert.deepEqual(evaluateDeal(base), { savingCents: 1000, savingPercent: 20, referenceCents: 5000 });
  });
  test("needs at least 7 days of history", () => {
    assert.equal(evaluateDeal({ ...base, days30: 6 }), null);
  });
  test("too small saving in percent or euro is no deal", () => {
    assert.equal(evaluateDeal({ ...base, bestCents: 4900 }), null); // 2 %
    assert.equal(evaluateDeal({ ...base, bestCents: 380, median30Cents: 420 }), null); // 9.5 % but only 0,40 €
  });
  test("above median is no deal", () => {
    assert.equal(evaluateDeal({ ...base, bestCents: 5200 }), null);
  });
});

describe("evaluateDrop", () => {
  test("drop vs previous day", () => {
    const d = evaluateDrop(base);
    assert.equal(d?.savingCents, 500);
    assert.equal(d?.savingPercent, 11.1);
  });
  test("no previous day → null", () => assert.equal(evaluateDrop({ ...base, prevBestCents: null }), null));
});

describe("lowestSince", () => {
  test("cheaper day 40 days ago", () => {
    assert.deepEqual(lowestSince({ ...base, lowestSinceDays: 40 }), { days: 40, sinceStart: false });
  });
  test("cheaper yesterday → nothing to say", () => {
    assert.equal(lowestSince({ ...base, lowestSinceDays: 1 }), null);
  });
  test("never cheaper → since start of our data", () => {
    assert.deepEqual(lowestSince(base), { days: 60, sinceStart: true });
  });
  test("too little history", () => {
    assert.equal(lowestSince({ ...base, historyDays: 3 }), null);
  });
});

describe("isLow90", () => {
  test("needs 90 days of data", () => assert.equal(isLow90({ ...base, historyDays: 80 }), false));
  test("never cheaper in 120 days", () => assert.equal(isLow90({ ...base, historyDays: 120 }), true));
  test("cheaper 30 days ago", () => assert.equal(isLow90({ ...base, historyDays: 120, lowestSinceDays: 30 }), false));
});

test("median", () => {
  assert.equal(median([]), null);
  assert.equal(median([3, 1, 2]), 2);
  assert.equal(median([4, 1, 2, 3]), 3); // (2+3)/2 = 2.5 → rounded 3
});

describe("chartGeometry", () => {
  const box = { width: 600, height: 200, left: 50, right: 10, top: 10, bottom: 30 };
  test("step path and gap handling", () => {
    const g = chartGeometry(
      [
        { day: "2026-11-01", cents: 5000 },
        { day: "2026-11-02", cents: 4800 },
        { day: "2026-11-10", cents: 4500 }, // gap of 8 days → new path
      ],
      box,
      { from: "2026-11-01", to: "2026-11-11" },
    );
    assert.equal(g.paths.length, 2);
    assert.ok(g.paths[0]!.startsWith("M50,"));
    assert.ok(g.paths[0]!.includes(" H"));
    assert.equal(g.dots.length, 3);
    // last point extended to "to" (gap 1 day)
    assert.ok(g.paths[1]!.endsWith(" H590"), g.paths[1]);
    // lower price → larger y
    assert.ok(g.dots[2]!.y > g.dots[0]!.y);
  });
  test("flat series gets a visible range", () => {
    const g = chartGeometry([{ day: "2026-11-01", cents: 1000 }], box, { from: "2026-10-02", to: "2026-11-01" });
    assert.ok(g.yTicks[0]!.cents < 1000 && g.yTicks[2]!.cents > 1000);
  });
});
