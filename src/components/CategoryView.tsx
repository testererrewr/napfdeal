import Link from "next/link";
import { AdNotice, PriceDisclaimer } from "@/components/AdNotice";
import { Breadcrumbs, type Crumb } from "@/components/Breadcrumbs";
import { EmptyState } from "@/components/editorial";
import { Paw } from "@/components/illustrations";
import { ProductList, ProductRow } from "@/components/products";
import { countryInfo, type Country } from "@/lib/countries";
import { PAGE_SIZE, type CategoryRow, type ListItem, type SortKey } from "@/lib/queries";
import { categoryPath } from "@/lib/urls";

export function CategoryView({
  country,
  current,
  crumbs,
  subcategories,
  counts,
  items,
  total,
  page,
  sort,
}: {
  country: Country;
  current: CategoryRow;
  crumbs: Crumb[];
  subcategories: CategoryRow[];
  counts: Map<number, number>;
  items: ListItem[];
  total: number;
  page: number;
  sort: SortKey;
}) {
  const base = categoryPath(country, current.path);
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const qs = (p: number, s: SortKey) => {
    const params = new URLSearchParams();
    if (s !== "grundpreis") params.set("sortierung", s);
    if (p > 1) params.set("seite", String(p));
    const q = params.toString();
    return q ? `${base}?${q}` : base;
  };

  return (
    <main className="mx-auto max-w-[72rem] px-4 md:px-8">
      <Breadcrumbs items={crumbs} />

      <div className="grid gap-6 pb-4 pt-6 md:grid-cols-12">
        <div className="md:col-span-8">
          <h1 className="text-4xl md:text-5xl">{current.name}</h1>
          <p className="mt-2 text-ink-soft">
            {total > 0
              ? `${total} ${total === 1 ? "Produkt" : "Produkte"} mit aktuellem Preis in ${countryInfo[country].name}.`
              : `Für ${countryInfo[country].name} haben wir hier gerade keine Produkte mit aktuellem Preis.`}
            {current.note ? ` ${current.note}.` : ""}
          </p>
        </div>
        <div className="hidden md:col-span-3 md:col-start-10 md:block">
          <Paw className="ml-auto h-20 w-20 -rotate-6 text-terracotta/60" />
        </div>
      </div>

      {subcategories.length > 0 ? (
        <nav aria-label="Unterkategorien" className="border-y border-ink py-3">
          <ul className="flex flex-wrap gap-x-5 gap-y-2 text-[0.95rem]">
            {subcategories.map((c) => {
              const n = counts.get(c.id) ?? 0;
              return (
                <li key={c.id}>
                  {n > 0 ? (
                    <Link href={categoryPath(country, c.path)} className="hover:text-terracotta hover:underline">
                      {c.name} <span className="text-ink-soft">({n})</span>
                    </Link>
                  ) : (
                    <span className="text-ink-soft">{c.name}</span>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>
      ) : null}

      {items.length > 0 ? (
        <>
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
            <AdNotice />
            <nav aria-label="Sortierung" className="flex items-center gap-1 text-sm">
              <span className="mr-1 text-ink-soft">Sortieren:</span>
              {(
                [
                  ["grundpreis", "Grundpreis"],
                  ["preis", "Preis"],
                ] as const
              ).map(([key, label]) => (
                <Link
                  key={key}
                  href={qs(1, key)}
                  aria-current={sort === key ? "true" : undefined}
                  className={`rounded-sm px-2 py-0.5 ${sort === key ? "bg-ink text-paper" : "text-ink-soft hover:text-ink"}`}
                >
                  {label}
                </Link>
              ))}
            </nav>
          </div>
          <ProductList>
            {items.map((item) => (
              <ProductRow key={item.productId} item={item} country={country} />
            ))}
          </ProductList>

          {pages > 1 ? (
            <nav aria-label="Seiten" className="mt-6 flex items-center justify-between border-t border-ink pt-4 text-sm">
              {page > 1 ? (
                <Link href={qs(page - 1, sort)} rel="prev" className="underline">
                  ← Vorherige Seite
                </Link>
              ) : (
                <span />
              )}
              <span className="text-ink-soft">
                Seite {page} von {pages}
              </span>
              {page < pages ? (
                <Link href={qs(page + 1, sort)} rel="next" className="underline">
                  Nächste Seite →
                </Link>
              ) : (
                <span />
              )}
            </nav>
          ) : null}
          <div className="mt-6">
            <PriceDisclaimer />
          </div>
        </>
      ) : (
        <div className="mt-8">
          <EmptyState title="Hier ist der Napf noch leer.">
            <p>Sobald ein angeschlossener Shop passende Produkte liefert, stehen sie hier mit Preis und Grundpreis.</p>
          </EmptyState>
        </div>
      )}
    </main>
  );
}
