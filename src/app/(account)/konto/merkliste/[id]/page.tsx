import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { removeFromListAction } from "@/app/actions/account";
import { PriceDisclaimer } from "@/components/AdNotice";
import { EmptyState, PriceTag } from "@/components/editorial";
import { ProductThumb } from "@/components/products";
import { getWatchlist, getWatchlistItems } from "@/lib/account-queries";
import { getSessionUser } from "@/lib/auth/session";
import { countryInfo, isCountry, type Country } from "@/lib/countries";
import { formatCheckedAt, formatEuro, formatUnitPrice } from "@/lib/format";
import { bestSingleShop, sumOfBest } from "@/lib/pricing/basket";
import { isPreview } from "@/lib/preview";
import { productPath } from "@/lib/urls";

export const metadata: Metadata = { title: "Merkliste" };
export const dynamic = "force-dynamic";

export default async function WatchlistPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const u = await getSessionUser();
  if (!u) redirect(`/anmelden/?next=/konto/merkliste/${id}/`);
  const list = await getWatchlist(u.id, Number(id));
  if (!list) notFound();

  const country: Country = isCountry(u.country) ? u.country : "de";
  const { items, stats, offers } = await getWatchlistItems(list.id, country, await isPreview());
  const ids = items.map((i) => i.productId);
  const single = bestSingleShop(ids, offers);
  const perItem = sumOfBest(ids, new Map([...stats].map(([pid, s]): [number, number] => [pid, s.bestCents])));

  return (
    <div>
      <p className="text-sm">
        <Link href="/konto/#merklisten" className="underline">
          ← Alle Merklisten
        </Link>
      </p>
      <h1 className="mt-3 text-4xl">{list.name}</h1>
      <p className="mt-1 text-ink-soft">Preise für {countryInfo[country].name}. Das Land stellst du in deinem Konto um.</p>

      {items.length === 0 ? (
        <div className="mt-8">
          <EmptyState title="Die Liste ist leer.">
            <p>Auf jeder Produktseite gibt es den Knopf „Merken“.</p>
          </EmptyState>
        </div>
      ) : (
        <>
          <dl className="mt-6 grid gap-4 border-y-2 border-ink py-4 sm:grid-cols-2">
            <div>
              <dt className="text-sm text-ink-soft">Alles in einem Shop</dt>
              {single ? (
                <dd>
                  <span className="tabular font-serif text-2xl font-semibold">{formatEuro(single.totalCents)}</span> bei{" "}
                  <strong>{single.shopName}</strong>
                  <span className="block text-xs text-ink-soft">
                    {formatEuro(single.itemsCents)} Artikel +{" "}
                    {single.shippingCents === null ? "Versand laut Shop" : `${formatEuro(single.shippingCents)} Versand (einmal gerechnet)`}
                  </span>
                </dd>
              ) : (
                <dd className="text-sm">Kein Shop hat gerade alle Produkte dieser Liste.</dd>
              )}
            </div>
            <div>
              <dt className="text-sm text-ink-soft">Jedes Produkt im günstigsten Shop</dt>
              <dd>
                <span className="tabular font-serif text-2xl font-semibold">{formatEuro(perItem.totalCents)}</span>
                <span className="block text-xs text-ink-soft">
                  inkl. Versand je Bestellung{perItem.missing > 0 ? `, ${perItem.missing} Produkt(e) gerade ohne Angebot` : ""}
                </span>
              </dd>
            </div>
          </dl>

          <ul className="mt-2">
            {items.map((i) => {
              const s = stats.get(i.productId);
              const href = productPath(country, i.categoryPath, i.slug);
              return (
                <li key={i.productId} className="flex gap-4 border-b border-dashed border-line py-4">
                  <ProductThumb productId={i.productId} hasImage={false} alt="" size={56} />
                  <div className="min-w-0 flex-1">
                    <Link href={href} className="font-semibold hover:underline">
                      {i.name}
                    </Link>
                    <p className="text-xs text-ink-soft">
                      {s ? `Preis geprüft: ${formatCheckedAt(s.checkedAt)}` : `In ${countryInfo[country].name} gerade kein Angebot`}
                    </p>
                    <form action={removeFromListAction} className="mt-1">
                      <input type="hidden" name="listId" value={list.id} />
                      <input type="hidden" name="productId" value={i.productId} />
                      <button type="submit" className="text-xs underline">
                        Aus der Liste nehmen
                      </button>
                    </form>
                  </div>
                  {s ? (
                    <div className="shrink-0 text-right">
                      <PriceTag amount={s.bestCents / 100} />
                      {formatUnitPrice(s.bestUnitPriceCents, i.sizeBaseUnit) ? (
                        <p className="tabular text-xs text-ink-soft">{formatUnitPrice(s.bestUnitPriceCents, i.sizeBaseUnit)}</p>
                      ) : null}
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
          <div className="mt-4">
            <PriceDisclaimer />
          </div>
        </>
      )}
    </div>
  );
}
