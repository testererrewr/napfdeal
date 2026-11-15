/**
 * Price alert input validation and human-readable conditions. Pure module.
 */

export type AlertKind = "target" | "drop";

export type AlertInput = {
  productId: number;
  country: "de" | "at";
  kind: AlertKind;
  targetCents: number | null;
  includeShipping: boolean;
  minDropPercent: number;
  minDropCents: number;
  backInStock: boolean;
  digest: boolean;
};

export const DEFAULT_MIN_DROP_PERCENT = 3;
export const DEFAULT_MIN_DROP_CENTS = 50;

function euroToCents(raw: string | null | undefined): number | null {
  if (!raw) return null;
  const s = raw.trim().replace(/\s|€/g, "");
  if (!/^\d{1,5}([.,]\d{1,2})?$/.test(s)) return null;
  return Math.round(Number(s.replace(",", ".")) * 100);
}

export type Field = (name: string) => string | null;

export function parseAlertInput(get: Field): { ok: true; value: AlertInput } | { ok: false; error: string } {
  const productId = Number(get("productId"));
  if (!Number.isSafeInteger(productId) || productId <= 0) return { ok: false, error: "Produkt fehlt." };
  const country = get("country");
  if (country !== "de" && country !== "at") return { ok: false, error: "Land fehlt." };

  const kind = get("kind") === "drop" ? "drop" : "target";
  let targetCents: number | null = null;
  if (kind === "target") {
    targetCents = euroToCents(get("target"));
    if (targetCents === null || targetCents <= 0) return { ok: false, error: "Bitte gib einen Wunschpreis in Euro an, zum Beispiel 39,90." };
  }

  let minDropPercent = DEFAULT_MIN_DROP_PERCENT;
  let minDropCents = DEFAULT_MIN_DROP_CENTS;
  if (kind === "drop") {
    const p = Number((get("minDropPercent") ?? "").replace(",", "."));
    if (get("minDropPercent")) {
      if (!Number.isFinite(p) || p < 1 || p > 90) return { ok: false, error: "Die Mindestsenkung in Prozent muss zwischen 1 und 90 liegen." };
      minDropPercent = Math.round(p * 10) / 10;
    }
    const c = euroToCents(get("minDropEuro"));
    if (get("minDropEuro")) {
      if (c === null || c < 1 || c > 100_000) return { ok: false, error: "Die Mindestsenkung in Euro passt nicht." };
      minDropCents = c;
    }
  }

  return {
    ok: true,
    value: {
      productId,
      country,
      kind,
      targetCents,
      // HTML checkboxes send nothing when unchecked; the form marks that the field was shown.
      includeShipping: get("includeShippingField") === "1" ? get("includeShipping") === "1" : get("includeShipping") !== "0",
      minDropPercent,
      minDropCents,
      backInStock: get("backInStock") === "1",
      digest: get("digest") === "1",
    },
  };
}

export function formatCents(cents: number): string {
  return `${(cents / 100).toFixed(2).replace(".", ",")} €`;
}

/** "Gesamtpreis inkl. Versand höchstens 39,90 €" / "Jeder Preisfall ab 3 % oder 0,50 €" (+ "oder wieder lieferbar") */
export type ConditionLike = {
  kind: string;
  targetCents: number | null;
  includeShipping: boolean;
  minDropPercent: number;
  minDropCents: number;
  backInStock: boolean;
};

export function describeCondition(a: ConditionLike): string {
  const base =
    a.kind === "target" && a.targetCents !== null
      ? `${a.includeShipping ? "Gesamtpreis inkl. Versand" : "Preis ohne Versand"} höchstens ${formatCents(a.targetCents)}`
      : `Jede Preissenkung ab ${String(a.minDropPercent).replace(".", ",")} % oder ${formatCents(a.minDropCents)}${a.includeShipping ? " (inkl. Versand)" : " (ohne Versand)"}`;
  return a.backInStock ? `${base}, oder wenn es wieder lieferbar ist` : base;
}

/** Simple, permissive address check (the confirmation mail is the real test). */
export function isPlausibleEmail(s: string): boolean {
  return s.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s);
}
