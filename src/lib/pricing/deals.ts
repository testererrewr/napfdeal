/**
 * Deal rules and price-history helpers. Pure module.
 *
 * Deal: current best total ≤ median of the daily best totals of the last 30 days (before today)
 *       minus at least `minPercent` % AND at least `minCents`, with ≥ 7 days of history.
 * Drop: current best total vs. the most recent earlier day.
 */

export type StatsLike = {
  bestCents: number;
  median30Cents: number | null;
  days30: number;
  prevBestCents: number | null;
  min90Cents: number | null;
  lowestSinceDays: number | null;
  historyDays: number;
};

export const DEAL_MIN_HISTORY_DAYS = 7;
export const DEAL_DEFAULTS = { minPercent: 5, minCents: 50 } as const;
export const DROP_DEFAULTS = { minPercent: 3, minCents: 50 } as const;
export const LOWEST_SINCE_MIN_DAYS = 7;

export type Saving = { savingCents: number; savingPercent: number; referenceCents: number };

function saving(current: number, reference: number): Saving {
  const savingCents = reference - current;
  return { savingCents, savingPercent: Math.round((savingCents / reference) * 1000) / 10, referenceCents: reference };
}

export function evaluateDeal(s: StatsLike, opts: { minPercent: number; minCents: number } = DEAL_DEFAULTS): Saving | null {
  if (s.days30 < DEAL_MIN_HISTORY_DAYS || s.median30Cents === null || s.median30Cents <= 0) return null;
  const sv = saving(s.bestCents, s.median30Cents);
  return sv.savingCents >= opts.minCents && sv.savingPercent >= opts.minPercent ? sv : null;
}

export function evaluateDrop(s: StatsLike, opts: { minPercent: number; minCents: number } = DROP_DEFAULTS): Saving | null {
  if (s.prevBestCents === null || s.prevBestCents <= 0) return null;
  const sv = saving(s.bestCents, s.prevBestCents);
  return sv.savingCents >= opts.minCents && sv.savingPercent >= opts.minPercent ? sv : null;
}

/**
 * "Tiefster Preis seit X Tagen". Returns null when there's too little history to say anything.
 * sinceStart = no earlier day was cheaper; X is then the number of days we have data for.
 */
export function lowestSince(s: StatsLike): { days: number; sinceStart: boolean } | null {
  if (s.lowestSinceDays !== null) {
    return s.lowestSinceDays >= LOWEST_SINCE_MIN_DAYS ? { days: s.lowestSinceDays, sinceStart: false } : null;
  }
  return s.historyDays >= LOWEST_SINCE_MIN_DAYS ? { days: s.historyDays, sinceStart: true } : null;
}

/** Lowest price for at least 90 days (requires 90 days of data). */
export function isLow90(s: StatsLike): boolean {
  if (s.historyDays < 90) return false;
  return s.lowestSinceDays === null || s.lowestSinceDays >= 90;
}

export function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const v = [...values].sort((a, b) => a - b);
  const mid = Math.floor(v.length / 2);
  return v.length % 2 ? (v[mid] as number) : Math.round(((v[mid - 1] as number) + (v[mid] as number)) / 2);
}

export type DailyPoint = { day: string; cents: number };

export function seriesSummary(points: DailyPoint[]): { min: number; max: number; median: number } | null {
  if (points.length === 0) return null;
  const values = points.map((p) => p.cents);
  return { min: Math.min(...values), max: Math.max(...values), median: median(values) as number };
}

/** Days between two YYYY-MM-DD dates (b − a). */
export function dayDiff(a: string, b: string): number {
  return Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86_400_000);
}

export type ChartGeometry = {
  /** One path per contiguous run of days (gaps > maxGapDays break the line) */
  paths: string[];
  dots: Array<{ x: number; y: number; day: string; cents: number }>;
  yTicks: Array<{ y: number; cents: number }>;
  xTicks: Array<{ x: number; day: string }>;
};

/**
 * Maps daily points into an SVG coordinate box. Steps (not diagonals) because a price holds
 * until it changes.
 */
export function chartGeometry(
  points: DailyPoint[],
  box: { width: number; height: number; left: number; right: number; top: number; bottom: number },
  range: { from: string; to: string },
  maxGapDays = 3,
): ChartGeometry {
  const totalDays = Math.max(1, dayDiff(range.from, range.to));
  const innerW = box.width - box.left - box.right;
  const innerH = box.height - box.top - box.bottom;
  const values = points.map((p) => p.cents);
  let lo = values.length ? Math.min(...values) : 0;
  let hi = values.length ? Math.max(...values) : 100;
  if (hi === lo) {
    hi += Math.max(50, Math.round(hi * 0.05));
    lo = Math.max(0, lo - Math.max(50, Math.round(lo * 0.05)));
  } else {
    const pad = Math.round((hi - lo) * 0.12);
    hi += pad;
    lo = Math.max(0, lo - pad);
  }

  const x = (day: string) => box.left + (dayDiff(range.from, day) / totalDays) * innerW;
  const y = (cents: number) => box.top + (1 - (cents - lo) / (hi - lo)) * innerH;
  const r = (n: number) => Math.round(n * 10) / 10;

  const sorted = [...points].sort((a, b) => a.day.localeCompare(b.day));
  const paths: string[] = [];
  let d = "";
  let prev: DailyPoint | null = null;
  for (const p of sorted) {
    if (!prev || dayDiff(prev.day, p.day) > maxGapDays) {
      if (d) paths.push(d);
      d = `M${r(x(p.day))},${r(y(p.cents))}`;
    } else {
      d += ` H${r(x(p.day))} V${r(y(p.cents))}`;
    }
    prev = p;
  }
  if (prev) {
    // Extend the last known price to "today" if the gap is small.
    if (dayDiff(prev.day, range.to) <= maxGapDays) d += ` H${r(x(range.to))}`;
    paths.push(d);
  }

  const yTicks = [0, 0.5, 1].map((f) => {
    const cents = Math.round(lo + (hi - lo) * f);
    return { y: r(y(cents)), cents };
  });

  const xTicks: Array<{ x: number; day: string }> = [];
  const steps = 4;
  for (let i = 0; i <= steps; i++) {
    const t = Date.parse(`${range.from}T00:00:00Z`) + Math.round((totalDays * i) / steps) * 86_400_000;
    const day = new Date(t).toISOString().slice(0, 10);
    xTicks.push({ x: r(x(day)), day });
  }

  return { paths, dots: sorted.map((p) => ({ x: r(x(p.day)), y: r(y(p.cents)), day: p.day, cents: p.cents })), yTicks, xTicks };
}
