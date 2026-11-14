/**
 * GTIN/EAN handling. All GTINs are stored as 14-digit strings (GTIN-14, left-padded with zeros),
 * so EAN-13 "4006381333931", UPC-A "036000291452" and GTIN-14 compare equal when they mean the same item.
 * Pure module.
 */

function checkDigitValid(digits: string): boolean {
  let sum = 0;
  const body = digits.slice(0, -1);
  // From the right, weights alternate 3,1,3,1… starting next to the check digit.
  for (let i = 0; i < body.length; i++) {
    const d = body.charCodeAt(body.length - 1 - i) - 48;
    sum += d * (i % 2 === 0 ? 3 : 1);
  }
  const check = (10 - (sum % 10)) % 10;
  return check === digits.charCodeAt(digits.length - 1) - 48;
}

/** Returns a normalized GTIN-14 or null if the value isn't a valid GTIN-8/12/13/14. */
export function normalizeGtin(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  // Spreadsheet damage like "4.00638E+12" is unrecoverable.
  if (/e\+/i.test(trimmed)) return null;
  const digits = trimmed.replace(/[\s-]/g, "");
  if (!/^\d+$/.test(digits)) return null;
  if (![8, 12, 13, 14].includes(digits.length)) return null;
  if (/^0+$/.test(digits)) return null;
  if (!checkDigitValid(digits)) return null;
  return digits.padStart(14, "0");
}

/** Splits fields that may hold several GTINs ("4006381333931, 4006381333948") and normalizes each. */
export function parseGtins(...fields: Array<string | null | undefined>): string[] {
  const out = new Set<string>();
  for (const f of fields) {
    if (!f) continue;
    for (const part of f.split(/[,;|/ ]+/)) {
      const g = normalizeGtin(part);
      if (g) out.add(g);
    }
  }
  return [...out];
}
