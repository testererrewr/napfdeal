export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://napfdeal.com").replace(/\/$/, "");

/** Operator data (Impressum / Datenschutz). Single source of truth. */
export const OPERATOR = {
  name: "Philipp Spreitzer",
  street: "Hauseggerstraße 63",
  zipCity: "8020 Graz",
  country: "Österreich",
  email: "napfdeal@gmail.com",
} as const;

export const TIME_ZONE = "Europe/Vienna";

export const legalLinks = [
  { href: "/impressum/", label: "Impressum" },
  { href: "/datenschutz/", label: "Datenschutz" },
  { href: "/cookies-und-speicher/", label: "Cookies & Speicher" },
  { href: "/nutzungsbedingungen/", label: "Nutzungsbedingungen" },
  { href: "/so-verdienen-wir-geld/", label: "So verdienen wir Geld" },
] as const;

/** "Samstag, 14. November 2026" – de-AT writes "Jänner", de-DE "Januar". */
export function formatLongDate(d: Date, locale: "de-DE" | "de-AT" = "de-DE"): string {
  return new Intl.DateTimeFormat(locale, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: TIME_ZONE,
  }).format(d);
}
