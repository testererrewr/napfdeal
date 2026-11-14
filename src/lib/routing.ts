/**
 * Resolves /[country]/[animal]/… URLs to a category or a product. Wrapped in React cache()
 * so generateMetadata and the page share one lookup per request.
 */
import { cache } from "react";
import type { Crumb } from "@/components/Breadcrumbs";
import { countryInfo, type Country } from "@/lib/countries";
import { isPreview } from "@/lib/preview";
import { getCategoryByPath, getProductBySlug, type CategoryRow, type ProductDetail } from "@/lib/queries";
import { categoryPath, productPath } from "@/lib/urls";

export const getPreview = cache(isPreview);
export const findCategory = cache((path: string) => getCategoryByPath(path));
export const findProduct = cache(async (slug: string) => getProductBySlug(slug, await getPreview()));

export type Resolved =
  | { kind: "category"; category: CategoryRow; animal: CategoryRow }
  | { kind: "product"; product: ProductDetail; animal: CategoryRow | null; sub: CategoryRow | null; canonical: string }
  | { kind: "notfound" };

export async function resolvePath(country: Country, segments: string[]): Promise<Resolved> {
  const [animalSlug, second, third, ...extra] = segments;
  if (!animalSlug || extra.length > 0) return { kind: "notfound" };

  const animal = await findCategory(animalSlug);
  if (!animal || animal.parentId !== null) return { kind: "notfound" };

  if (second === undefined) return { kind: "category", category: animal, animal };

  if (third === undefined) {
    const sub = await findCategory(`${animalSlug}/${second}`);
    if (sub) return { kind: "category", category: sub, animal };
  }

  const slug = third ?? second;
  const product = await findProduct(slug);
  if (!product) return { kind: "notfound" };

  const canonical = productPath(country, product.categoryPath, product.slug);
  let sub: CategoryRow | null = null;
  let productAnimal: CategoryRow | null = null;
  if (product.categoryPath) {
    const [a, s] = product.categoryPath.split("/");
    productAnimal = a ? await findCategory(a) : null;
    sub = s ? await findCategory(product.categoryPath) : null;
  } else {
    productAnimal = await findCategory("sonstiges");
  }
  return { kind: "product", product, animal: productAnimal, sub, canonical };
}

export function crumbsFor(country: Country, ...cats: Array<CategoryRow | null>): Crumb[] {
  const crumbs: Crumb[] = [{ name: `Heute im Napf (${countryInfo[country].name})`, href: `/${country}/` }];
  for (const c of cats) if (c) crumbs.push({ name: c.name, href: categoryPath(country, c.path) });
  return crumbs;
}
