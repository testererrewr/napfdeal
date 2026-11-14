import type { MetadataRoute } from "next";
import { COUNTRIES, countryInfo } from "@/lib/countries";
import { countByCategory, getCategoryPaths, getSitemapProducts } from "@/lib/queries";
import { legalLinks, SITE_URL } from "@/lib/site";
import { categoryPath, productPath } from "@/lib/urls";

// Reads the catalogue from the database; never prerendered at build time.
export const dynamic = "force-dynamic";

function languages(subpath: string) {
  return Object.fromEntries(COUNTRIES.map((c) => [countryInfo[c].hreflang, `${SITE_URL}${subpath.replace(/^\/(de|at)\//, `/${c}/`)}`]));
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const entries: MetadataRoute.Sitemap = [{ url: `${SITE_URL}/`, lastModified: now, changeFrequency: "monthly", priority: 0.5 }];

  let paths = new Map<number, string>();
  try {
    paths = await getCategoryPaths();
  } catch {
    paths = new Map();
  }

  for (const c of COUNTRIES) {
    entries.push({ url: `${SITE_URL}/${c}/`, lastModified: now, changeFrequency: "daily", priority: 1, alternates: { languages: languages(`/${c}/`) } });
    // Only categories that currently list products (no empty pages in the sitemap).
    const filled = new Set<string>();
    try {
      for (const [id, n] of await countByCategory(c, false)) {
        const p = paths.get(id);
        if (p && n > 0) {
          filled.add(p);
          filled.add(p.split("/")[0] as string);
        }
      }
    } catch {
      // ignore
    }
    for (const path of filled) {
      const p = categoryPath(c, path);
      entries.push({ url: `${SITE_URL}${p}`, lastModified: now, changeFrequency: "daily", priority: 0.7, alternates: { languages: languages(p) } });
    }
    try {
      for (const prod of await getSitemapProducts(c)) {
        const p = productPath(c, prod.categoryPath, prod.slug);
        entries.push({ url: `${SITE_URL}${p}`, lastModified: prod.updatedAt, changeFrequency: "daily", priority: 0.6 });
      }
    } catch {
      // Database unavailable: still serve the static part.
    }
  }

  for (const l of legalLinks) {
    entries.push({ url: `${SITE_URL}${l.href}`, lastModified: now, changeFrequency: "yearly", priority: 0.2 });
  }
  return entries;
}
