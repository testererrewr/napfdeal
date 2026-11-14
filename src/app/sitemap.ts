import type { MetadataRoute } from "next";
import { COUNTRIES, countryInfo } from "@/lib/countries";
import { legalLinks, SITE_URL } from "@/lib/site";

// Phase 2 splits this into one sitemap per country (products, categories, articles).
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const countryHomes = COUNTRIES.map((c) => ({
    url: `${SITE_URL}/${c}/`,
    lastModified: now,
    changeFrequency: "daily" as const,
    priority: 1,
    alternates: {
      languages: Object.fromEntries(COUNTRIES.map((x) => [countryInfo[x].hreflang, `${SITE_URL}/${x}/`])),
    },
  }));

  return [
    { url: `${SITE_URL}/`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    ...countryHomes,
    ...legalLinks.map((l) => ({
      url: `${SITE_URL}${l.href}`,
      lastModified: now,
      changeFrequency: "yearly" as const,
      priority: 0.2,
    })),
  ];
}
