import type { Country } from "@/lib/countries";

/**
 * Product URLs: /de/hund/trockenfutter/<slug>/ ; products without subcategory /de/hund/<slug>/ ;
 * without any category /de/sonstiges/<slug>/.
 */
export function productPath(country: Country, categoryPath: string | null, slug: string): string {
  return `/${country}/${categoryPath ?? "sonstiges"}/${slug}/`;
}

export function categoryPath(country: Country, path: string): string {
  return `/${country}/${path}/`;
}

export function goPath(offerId: number, source?: string): string {
  return source ? `/go/${offerId}/?utm_source=${encodeURIComponent(source)}` : `/go/${offerId}/`;
}

export function productImagePath(productId: number): string {
  return `/img/p/${productId}/`;
}
