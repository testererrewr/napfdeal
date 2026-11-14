/**
 * Pack size parsing for unit prices (price per kg / litre / piece).
 *
 * Order of trust:
 *   1. a measure field from the feed (e.g. "12 kg", "6 x 400 g")
 *   2. the product title
 * Anything ambiguous returns status "review" and goes to the admin queue – we never guess.
 *
 * Pure module (no imports) so it runs under `node --test` without dependencies.
 */

export type SizeUnit = "g" | "kg" | "ml" | "l" | "stk";
export type BaseUnit = "kg" | "l" | "stk";

export type PackSize = {
  /** Number of items, e.g. 6 in "6 x 400 g". 1 for single packs. */
  count: number;
  /** Amount per item in `unit`. */
  amount: number;
  unit: SizeUnit;
  /** Total amount in `baseUnit` (kg, l or pieces). */
  total: number;
  baseUnit: BaseUnit;
  /** Human-readable, e.g. "6 × 400 g". */
  label: string;
};

export type PackSizeResult =
  | { status: "ok"; size: PackSize; source: "feed" | "title" }
  | { status: "review"; reason: string; candidates: PackSize[] }
  | { status: "none" };

const UNIT_ALIASES: Record<string, SizeUnit> = {
  g: "g",
  gr: "g",
  gramm: "g",
  kg: "kg",
  kilo: "kg",
  kilogramm: "kg",
  ml: "ml",
  milliliter: "ml",
  l: "l",
  ltr: "l",
  liter: "l",
  stk: "stk",
  "stk.": "stk",
  "st.": "stk",
  "stück": "stk",
  stueck: "stk",
  "tabletten": "stk",
};

const WEIGHT_UNITS = "kg|kilogramm|kilo|gramm|gr|g|ml|milliliter|ltr|liter|l";
const PIECE_UNITS = "stück|stueck|stk\\.?|st\\.|tabletten";
const NUM = "(\\d+(?:[.,]\\d+)?)";

// "6 x 400 g", "6x400g", "12 × 85 g", "2 * 12 kg"
const MULTI_RE = new RegExp(`(\\d+)\\s*[x×*]\\s*${NUM}\\s*(${WEIGHT_UNITS})(?![a-zäöü])`, "gi");
// "12 kg", "1,5 kg", "400g"
const SINGLE_RE = new RegExp(`${NUM}\\s*(${WEIGHT_UNITS})(?![a-zäöü])`, "gi");
// "24 Stück", "100 Stk."
const PIECE_RE = new RegExp(`(\\d+)\\s*(${PIECE_UNITS})(?![a-zäöü])`, "gi");
// Animal weight ranges, not pack sizes: "10-25 kg", "10 – 25 kg", "bis 10 kg", "ab 5 kg", "für Hunde über 20 kg"
const RANGE_RE = new RegExp(`(\\d+(?:[.,]\\d+)?\\s*(?:${WEIGHT_UNITS})?\\s*[-–—]\\s*${NUM}\\s*(${WEIGHT_UNITS}))|((?:bis|ab|über|unter|von)\\s+${NUM}\\s*(${WEIGHT_UNITS}))`, "gi");

function toNumber(s: string): number {
  return Number(s.replace(",", "."));
}

function normalizeUnit(raw: string): SizeUnit | null {
  return UNIT_ALIASES[raw.toLowerCase()] ?? null;
}

function fmt(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toLocaleString("de-DE", { maximumFractionDigits: 3 });
}

export function makePackSize(count: number, amount: number, unit: SizeUnit): PackSize | null {
  if (!(count > 0) || !(amount > 0)) return null;
  let total: number;
  let baseUnit: BaseUnit;
  switch (unit) {
    case "g":
      total = (count * amount) / 1000;
      baseUnit = "kg";
      break;
    case "kg":
      total = count * amount;
      baseUnit = "kg";
      break;
    case "ml":
      total = (count * amount) / 1000;
      baseUnit = "l";
      break;
    case "l":
      total = count * amount;
      baseUnit = "l";
      break;
    case "stk":
      total = count * amount;
      baseUnit = "stk";
      break;
  }
  // Sanity limits: 1 g … 2 t, 1 ml … 2000 l, 1 … 10 000 pieces
  if (baseUnit === "stk" ? total < 1 || total > 10_000 : total < 0.001 || total > 2000) return null;
  total = Math.round(total * 1_000_000) / 1_000_000;
  const unitLabel = unit === "stk" ? "Stück" : unit;
  const label = count > 1 ? `${count} × ${fmt(amount)} ${unitLabel}` : `${fmt(amount)} ${unitLabel}`;
  return { count, amount, unit, total, baseUnit, label };
}

function sameSize(a: PackSize, b: PackSize): boolean {
  return a.baseUnit === b.baseUnit && Math.abs(a.total - b.total) < 1e-9;
}

function dedupe(sizes: PackSize[]): PackSize[] {
  const out: PackSize[] = [];
  for (const s of sizes) if (!out.some((o) => sameSize(o, s))) out.push(s);
  return out;
}

/** Extracts all candidate sizes from free text. */
export function extractSizes(text: string): PackSize[] {
  // Blank out animal weight ranges ("für Hunde 10–25 kg") so they aren't read as pack sizes.
  let t = ` ${text} `.replace(RANGE_RE, (m) => " ".repeat(m.length));

  const multis: PackSize[] = [];
  t = t.replace(MULTI_RE, (m, count: string, amount: string, unit: string) => {
    const u = normalizeUnit(unit);
    const s = u ? makePackSize(Number(count), toNumber(amount), u) : null;
    if (s) multis.push(s);
    return " ".repeat(m.length);
  });

  const singles: PackSize[] = [];
  for (const m of t.matchAll(SINGLE_RE)) {
    const u = normalizeUnit(m[2] ?? "");
    const s = u ? makePackSize(1, toNumber(m[1] ?? ""), u) : null;
    if (s) singles.push(s);
  }

  // A single size equal to a multipack's item size describes the same pack ("Dose 400 g, 6 x 400 g").
  const itemSizes = multis.map((m) => makePackSize(1, m.amount, m.unit)).filter((s): s is PackSize => s !== null);
  const independentSingles = singles.filter((s) => !itemSizes.some((i) => sameSize(i, s)));

  const weighted = dedupe([...multis, ...independentSingles]);
  if (weighted.length > 0) return weighted;

  const pieces: PackSize[] = [];
  for (const m of t.matchAll(PIECE_RE)) {
    const s = makePackSize(1, Number(m[1]), "stk");
    if (s) pieces.push(s);
  }
  return dedupe(pieces);
}

/**
 * Decide the pack size for an offer.
 * @param feedMeasure measure field from the feed, if any ("12 kg", "6x400g")
 * @param title       product title
 */
export function parsePackSize(feedMeasure: string | null | undefined, title: string): PackSizeResult {
  if (feedMeasure && feedMeasure.trim()) {
    const fromFeed = extractSizes(feedMeasure);
    if (fromFeed.length === 1 && fromFeed[0]) return { status: "ok", size: fromFeed[0], source: "feed" };
    if (fromFeed.length > 1) return { status: "review", reason: "feed measure ambiguous", candidates: fromFeed };
  }

  const fromTitle = extractSizes(title);
  if (fromTitle.length === 1 && fromTitle[0]) return { status: "ok", size: fromTitle[0], source: "title" };
  if (fromTitle.length > 1) return { status: "review", reason: "several sizes in title", candidates: fromTitle };
  return { status: "none" };
}

/** Price per base unit in cents (per kg, per litre, per piece). Rounded to whole cents. */
export function unitPriceCents(totalPriceCents: number, size: PackSize): number {
  return Math.round(totalPriceCents / size.total);
}

export function baseUnitLabel(u: BaseUnit): string {
  return u === "stk" ? "Stück" : u === "kg" ? "kg" : "Liter";
}
