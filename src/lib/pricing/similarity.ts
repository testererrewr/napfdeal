/**
 * Fuzzy product similarity for offers WITHOUT a GTIN.
 * Used only to SUGGEST a match for the admin queue (match_review) – never to merge automatically.
 * Pure module.
 */

const STOPWORDS = new Set([
  "für", "fuer", "mit", "und", "der", "die", "das", "von", "im", "in", "ohne", "a", "the", "for", "with",
  "hund", "hunde", "katze", "katzen", "futter", "trockenfutter", "nassfutter", "adult", "pack", "packung",
  "sparpaket", "x", "×",
]);

export function foldText(s: string): string {
  return s
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "");
}

export function normalizeBrand(brand: string | null | undefined): string {
  return brand ? foldText(brand).replace(/[^a-z0-9]+/g, "") : "";
}

/** Name tokens without sizes, numbers with units, punctuation and generic words. */
export function nameTokens(name: string, brand?: string | null): string[] {
  let t = foldText(name);
  const b = brand ? foldText(brand) : "";
  if (b) t = t.split(b).join(" ");
  t = t
    .replace(/\d+(?:[.,]\d+)?\s*(?:kg|g|gr|ml|l|ltr|liter|stueck|stk)\b/g, " ")
    .replace(/\d+\s*[x×*]\s*/g, " ")
    .replace(/[^a-z0-9]+/g, " ");
  return [...new Set(t.split(" ").filter((w) => w.length > 1 && !STOPWORDS.has(w)))];
}

export function jaccard(a: string[], b: string[]): number {
  if (a.length === 0 && b.length === 0) return 0;
  const sa = new Set(a);
  let inter = 0;
  for (const w of new Set(b)) if (sa.has(w)) inter++;
  return inter / (sa.size + new Set(b).size - inter);
}

export type Comparable = {
  name: string;
  brand: string | null;
  /** Total pack size in base unit, e.g. 12 for 12 kg. null if unknown. */
  sizeTotal: number | null;
  sizeUnit: string | null;
};

/**
 * Score 0…1. Different brands → 0. Different known sizes → halved (same product line, other size
 * is a different product for price comparison).
 */
export function matchScore(a: Comparable, b: Comparable): number {
  const ba = normalizeBrand(a.brand);
  const bb = normalizeBrand(b.brand);
  if (!ba || !bb || ba !== bb) return 0;
  let score = jaccard(nameTokens(a.name, a.brand), nameTokens(b.name, b.brand));
  if (a.sizeTotal !== null && b.sizeTotal !== null) {
    const sameSize = a.sizeUnit === b.sizeUnit && Math.abs(a.sizeTotal - b.sizeTotal) < 1e-6;
    if (!sameSize) score *= 0.5;
  }
  return Math.round(score * 1000) / 1000;
}

/** Minimum score for a suggestion to be put into the review queue. */
export const SUGGESTION_THRESHOLD = 0.6;
