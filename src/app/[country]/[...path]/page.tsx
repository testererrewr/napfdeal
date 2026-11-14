import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { CategoryView } from "@/components/CategoryView";
import { CHART_RANGES, type ChartRange } from "@/components/PriceChart";
import { ProductView } from "@/components/ProductView";
import { COUNTRIES, countryInfo, isCountry, type Country } from "@/lib/countries";
import { addDays, formatEuro, todayKey } from "@/lib/format";
import { countByCategory, getCategoryProducts, getChildren, getDailySeries, getGtins, getOffers, getStats, type SortKey } from "@/lib/queries";
import { crumbsFor, getPreview, resolvePath } from "@/lib/routing";
import { categoryPath } from "@/lib/urls";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ country: string; path: string[] }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function one(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

function alternates(subpath: string) {
  return {
    canonical: subpath,
    languages: Object.fromEntries([
      ...COUNTRIES.map((c) => [countryInfo[c].hreflang, subpath.replace(/^\/(de|at)\//, `/${c}/`)]),
      ["x-default", "/"],
    ]),
  };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { country, path } = await params;
  if (!isCountry(country)) return {};
  const r = await resolvePath(country, path);
  const preview = await getPreview();
  const robots = preview ? { index: false, follow: false } : undefined;

  if (r.kind === "category") {
    const name = r.category.parentId === null ? r.category.name : `${r.category.name} für ${r.animal.name}`;
    return {
      title: `${name}: Preise vergleichen in ${countryInfo[country].name}`,
      description: `${name} im Preisvergleich: aktuelle Preise inklusive Versand, Grundpreis pro kg und Preisverlauf aus mehreren Shops in ${countryInfo[country].name}.`,
      alternates: alternates(categoryPath(country, r.category.path)),
      robots,
    };
  }
  if (r.kind === "product") {
    const stats = await getStats(r.product.id, country);
    const price = stats ? ` ab ${formatEuro(stats.bestCents)}` : "";
    return {
      title: `${r.product.name}${price} – Preisvergleich ${countryInfo[country].name}`,
      description: `${r.product.name}: Preise ${stats ? `von ${stats.offerCount} ${stats.offerCount === 1 ? "Shop" : "Shops"} ` : ""}inklusive Versand, Grundpreis und Preisverlauf in ${countryInfo[country].name}.`,
      alternates: alternates(r.canonical),
      robots,
    };
  }
  return {};
}

export default async function CatalogPage({ params, searchParams }: Props) {
  const { country: rawCountry, path } = await params;
  if (!isCountry(rawCountry)) notFound();
  const country: Country = rawCountry;
  const sp = await searchParams;
  const preview = await getPreview();
  const r = await resolvePath(country, path);

  if (r.kind === "notfound") notFound();

  if (r.kind === "category") {
    const isAnimal = r.category.parentId === null;
    const [children, counts] = await Promise.all([isAnimal ? getChildren(r.category.id) : Promise.resolve([]), countByCategory(country, preview)]);
    const sortParam = one(sp.sortierung);
    const sort: SortKey = sortParam === "preis" ? "preis" : "grundpreis";
    const page = Math.max(1, Math.min(1000, Number.parseInt(one(sp.seite) ?? "1", 10) || 1));
    const categoryIds = [r.category.id, ...children.map((c) => c.id)];
    const { items, total } = await getCategoryProducts({ country, includeTest: preview, categoryIds, sort, page });
    const crumbs = crumbsFor(country, r.animal, isAnimal ? null : r.category);
    return (
      <CategoryView
        country={country}
        current={r.category}
        crumbs={crumbs}
        subcategories={children}
        counts={counts}
        items={items}
        total={total}
        page={page}
        sort={sort}
      />
    );
  }

  // Product: always serve under its canonical URL.
  const requested = `/${country}/${path.join("/")}/`;
  if (requested !== r.canonical) permanentRedirect(r.canonical);

  const rangeParam = one(sp.zeitraum);
  const range: ChartRange = rangeParam && rangeParam in CHART_RANGES ? (rangeParam as ChartRange) : "90";
  const today = todayKey();
  const other = COUNTRIES.find((c) => c !== country) as Country;

  const [offers, otherOffers, gtins, stats, points] = await Promise.all([
    getOffers(r.product.id, country, preview),
    getOffers(r.product.id, other, preview),
    getGtins(r.product.id),
    getStats(r.product.id, country),
    getDailySeries(r.product.id, country, addDays(today, -CHART_RANGES[range])),
  ]);

  const crumbs = [...crumbsFor(country, r.animal, r.sub), { name: r.product.name, href: r.canonical }];

  return (
    <ProductView
      country={country}
      product={r.product}
      crumbs={crumbs}
      offers={offers}
      otherCountryOffers={otherOffers.length}
      gtins={gtins}
      stats={stats}
      points={points}
      today={today}
      range={range}
    />
  );
}
