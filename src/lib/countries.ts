export const COUNTRIES = ["de", "at"] as const;
export type Country = (typeof COUNTRIES)[number];

export const COUNTRY_STORAGE_KEY = "napfdeal.country";

export const countryInfo: Record<
  Country,
  { name: string; hreflang: string; edition: string; shopsIn: string }
> = {
  de: {
    name: "Deutschland",
    hreflang: "de-DE",
    edition: "Ausgabe Deutschland",
    shopsIn: "Shops, die nach Deutschland liefern",
  },
  at: {
    name: "Österreich",
    hreflang: "de-AT",
    edition: "Ausgabe Österreich",
    shopsIn: "Shops, die nach Österreich liefern",
  },
};

export function isCountry(value: unknown): value is Country {
  return typeof value === "string" && (COUNTRIES as readonly string[]).includes(value);
}

/** Alternates for hreflang: same path in both countries plus x-default. */
export function countryAlternates(country: Country, subpath = "") {
  return {
    canonical: `/${country}/${subpath}`,
    languages: {
      "de-DE": `/de/${subpath}`,
      "de-AT": `/at/${subpath}`,
      "x-default": "/",
    },
  };
}
