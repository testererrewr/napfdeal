/**
 * Decisions for one offer on one import: did the price change, is it an outlier, is a daily
 * history anchor due? Pure module – the importer applies the result to the database.
 *
 * Outlier rule: if the total price (price + shipping) drops by at least `suspectDropRatio`
 * in one step, the new price is stored but flagged `suspect`. It only counts for deals after the
 * NEXT import reports the same price (confirmation) or an admin confirms it.
 */

export type StoredOfferState = {
  priceCents: number;
  shippingCents: number | null;
  available: boolean;
  suspect: boolean;
};

export type Observation = {
  priceCents: number;
  shippingCents: number | null;
  available: boolean;
};

export type ChangeDecision = {
  /** price, shipping or availability differ from what we had → write a history row */
  changed: boolean;
  /** price or shipping differ (not just availability) → update price_changed_at */
  priceChanged: boolean;
  /** offer stays/becomes suspect after this import */
  suspect: boolean;
  /** previous suspect price was seen again → mark the earlier suspect history row as confirmed */
  confirmsSuspect: boolean;
  /** relative change of the total, negative = cheaper (-0.25 = 25 % cheaper) */
  totalChangeRatio: number;
};

export const DEFAULT_SUSPECT_DROP_RATIO = 0.6;

export function totalCents(o: { priceCents: number; shippingCents: number | null }): number {
  return o.priceCents + (o.shippingCents ?? 0);
}

export function decidePriceChange(
  prev: StoredOfferState | null,
  next: Observation,
  suspectDropRatio: number = DEFAULT_SUSPECT_DROP_RATIO,
): ChangeDecision {
  if (!prev) {
    return { changed: true, priceChanged: true, suspect: false, confirmsSuspect: false, totalChangeRatio: 0 };
  }

  const before = totalCents(prev);
  const after = totalCents(next);
  const priceChanged = prev.priceCents !== next.priceCents || (prev.shippingCents ?? null) !== (next.shippingCents ?? null);
  const changed = priceChanged || prev.available !== next.available;
  const ratio = before > 0 ? (after - before) / before : 0;

  if (!priceChanged) {
    // Same price as last time. If it was suspect, this import confirms it.
    return { changed, priceChanged, suspect: false, confirmsSuspect: prev.suspect, totalChangeRatio: 0 };
  }

  const suspect = ratio <= -suspectDropRatio;
  return { changed, priceChanged, suspect, confirmsSuspect: false, totalChangeRatio: ratio };
}

/** Calendar day (YYYY-MM-DD) in the given time zone. */
export function dayKey(d: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
}

/** A daily anchor row is due if the last history row is from an earlier calendar day. */
export function needsDailyAnchor(lastHistoryAt: Date | null, now: Date, timeZone: string): boolean {
  if (!lastHistoryAt) return true;
  return dayKey(lastHistoryAt, timeZone) !== dayKey(now, timeZone);
}
