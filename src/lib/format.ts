/** Display formatting (de, Europe/Vienna). Pure module. */

const TZ = "Europe/Vienna";

const euro = new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" });

export function formatEuro(cents: number): string {
  return euro.format(cents / 100);
}

/** "4,58 €/kg", "2,10 €/Liter", "0,42 €/Stück" */
export function formatUnitPrice(cents: number | null | undefined, baseUnit: string | null | undefined): string | null {
  if (cents === null || cents === undefined || !baseUnit) return null;
  const unit = baseUnit === "stk" ? "Stück" : baseUnit === "l" ? "Liter" : "kg";
  return `${formatEuro(cents)}/${unit}`;
}

/** "14.11.2026, 05:34 Uhr" */
export function formatCheckedAt(d: Date): string {
  const date = new Intl.DateTimeFormat("de-DE", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: TZ }).format(d);
  const time = new Intl.DateTimeFormat("de-DE", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: TZ }).format(d);
  return `${date}, ${time} Uhr`;
}

/** "2026-11-12" → "12.11." */
export function formatShortDay(day: string): string {
  const [, m, d] = day.split("-");
  return `${Number(d)}.${Number(m)}.`;
}

/** Today in Vienna as YYYY-MM-DD */
export function todayKey(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}

export function addDays(day: string, n: number): string {
  return new Date(Date.parse(`${day}T00:00:00Z`) + n * 86_400_000).toISOString().slice(0, 10);
}

export function formatPercent(p: number): string {
  return `${p.toLocaleString("de-DE", { maximumFractionDigits: 0 })} %`;
}

/** "gestern", "vorgestern" or "am 12.11." */
export function relativeDay(day: string, today: string): string {
  const diff = Math.round((Date.parse(`${today}T00:00:00Z`) - Date.parse(`${day}T00:00:00Z`)) / 86_400_000);
  if (diff === 1) return "gestern";
  if (diff === 2) return "vorgestern";
  return `am ${formatShortDay(day)}`;
}
