import Link from "next/link";
import { AdNotice, PriceDisclaimer } from "@/components/AdNotice";
import { Breadcrumbs, type Crumb } from "@/components/Breadcrumbs";
import { EmptyState, PriceTag, SectionHead } from "@/components/editorial";
import { PriceChart, type ChartRange } from "@/components/PriceChart";
import { PriceTable } from "@/components/PriceTable";
import { LowestSinceNote, ProductThumb } from "@/components/products";
import { COUNTRIES, countryInfo, type Country } from "@/lib/countries";
import { formatCheckedAt, formatEuro, formatUnitPrice } from "@/lib/format";
import type { DailyPoint } from "@/lib/pricing/deals";
import { lowestSince } from "@/lib/pricing/deals";
import type { OfferRow, ProductDetail } from "@/lib/queries";
import { SITE_URL } from "@/lib/site";
import { productPath } from "@/lib/urls";

type Stats = {
  bestCents: number;
  median30Cents: number | null;
  days30: number;
  prevBestCents: number | null;
  min90Cents: number | null;
  lowestSinceDays: number | null;
  historyDays: number;
} | null;

function productJsonLd(p: ProductDetail, country: Country, offers: OfferRow[], gtins: string[]) {
  const available = offers.filter((o) => o.available);
  const prices = available.map((o) => o.priceCents);
  const gtin13 = gtins.map((g) => g.replace(/^0/, "")).find((g) => g.length === 13);
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.name,
    ...(p.brand ? { brand: { "@type": "Brand", name: p.brand } } : {}),
    ...(gtin13 ? { gtin13 } : {}),
    ...(p.hasImage ? { image: `${SITE_URL}/img/p/${p.id}/` } : {}),
    url: `${SITE_URL}${productPath(country, p.categoryPath, p.slug)}`,
    ...(prices.length > 0
      ? {
          offers: {
            "@type": "AggregateOffer",
            priceCurrency: "EUR",
            lowPrice: (Math.min(...prices) / 100).toFixed(2),
            highPrice: (Math.max(...prices) / 100).toFixed(2),
            offerCount: available.length,
            availability: "https://schema.org/InStock",
          },
        }
      : {}),
  };
}

export function ProductView({
  country,
  product: p,
  crumbs,
  offers,
  otherCountryOffers,
  gtins,
  stats,
  points,
  today,
  range,
}: {
  country: Country;
  product: ProductDetail;
  crumbs: Crumb[];
  offers: OfferRow[];
  otherCountryOffers: number;
  gtins: string[];
  stats: Stats;
  points: DailyPoint[];
  today: string;
  range: ChartRange;
}) {
  const path = productPath(country, p.categoryPath, p.slug);
  const best = offers.find((o) => o.available && !o.suspect) ?? null;
  const low = stats ? lowestSince(stats) : null;
  const other = COUNTRIES.find((c) => c !== country) as Country;
  const lastChecked = offers.reduce<Date | null>((acc, o) => (!acc || o.checkedAt > acc ? o.checkedAt : acc), null);

  return (
    <main className="mx-auto max-w-[72rem] px-4 md:px-8">
      <Breadcrumbs items={crumbs} />

      <div className="grid gap-8 pt-6 md:grid-cols-12">
        <div className="md:col-span-3">
          <ProductThumb productId={p.id} hasImage={p.hasImage} alt={p.name} size={220} />
        </div>
        <div className="md:col-span-9">
          <h1 className="text-3xl md:text-4xl">{p.name}</h1>
          <dl className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm text-ink-soft">
            {p.brand ? (
              <div className="flex gap-1">
                <dt>Marke:</dt>
                <dd className="text-ink">{p.brand}</dd>
              </div>
            ) : null}
            {p.sizeLabel ? (
              <div className="flex gap-1">
                <dt>Packung:</dt>
                <dd className="text-ink">{p.sizeLabel}</dd>
              </div>
            ) : null}
            {gtins.length > 0 ? (
              <div className="flex gap-1">
                <dt>EAN:</dt>
                <dd className="tabular text-ink">{gtins.map((g) => g.replace(/^0+(?=\d{13}$)/, "")).join(", ")}</dd>
              </div>
            ) : null}
          </dl>

          {best ? (
            <div className="mt-6 flex flex-wrap items-end gap-x-6 gap-y-3">
              <div>
                <p className="text-sm text-ink-soft">Günstigster Gesamtpreis in {countryInfo[country].name}</p>
                <PriceTag amount={best.totalCents / 100} className="mt-1 text-3xl" />
              </div>
              <div className="text-sm">
                <p>
                  bei <strong>{best.shopName}</strong>
                  {best.unitPriceCents ? <> · {formatUnitPrice(best.unitPriceCents, p.sizeBaseUnit)}</> : null}
                </p>
                <p className="text-ink-soft">Preis geprüft: {formatCheckedAt(best.checkedAt)}</p>
              </div>
              {low ? (
                <div className="pb-6 pl-10">
                  <LowestSinceNote days={low.days} sinceStart={low.sinceStart} />
                </div>
              ) : null}
            </div>
          ) : null}

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button type="button" disabled className="cursor-not-allowed rounded-sm border border-ink px-3 py-2 text-sm opacity-60">
              Merken
            </button>
            <button type="button" disabled className="cursor-not-allowed rounded-sm border border-ink px-3 py-2 text-sm opacity-60">
              Preis-Alarm
            </button>
            <span className="text-xs text-ink-soft">Merklisten und Preis-Alarm kommen bald.</span>
          </div>
        </div>
      </div>

      <section aria-labelledby="preise" className="mt-12">
        <SectionHead id="preise" kicker={`Preise in ${countryInfo[country].name}`} dek="Sortiert nach Gesamtpreis inklusive Versand." />
        {offers.length > 0 ? (
          <>
            <div className="mt-4">
              <AdNotice />
            </div>
            <div className="mt-4">
              <PriceTable offers={offers} baseUnit={p.sizeBaseUnit} />
            </div>
            <div className="mt-3">
              <PriceDisclaimer />
              {lastChecked ? <p className="text-xs text-ink-soft">Letzte Prüfung: {formatCheckedAt(lastChecked)}</p> : null}
            </div>
          </>
        ) : (
          <div className="mt-4">
            <EmptyState title={`In ${countryInfo[country].name} haben wir dafür gerade kein Angebot.`}>
              {otherCountryOffers > 0 ? (
                <p>
                  In {countryInfo[other].name} gibt es {otherCountryOffers === 1 ? "ein Angebot" : `${otherCountryOffers} Angebote`}.{" "}
                  <Link href={productPath(other, p.categoryPath, p.slug)} className="underline">
                    Zur {countryInfo[other].edition}
                  </Link>
                </p>
              ) : null}
            </EmptyState>
          </div>
        )}
      </section>

      <section aria-labelledby="preisverlauf-titel" id="preisverlauf" className="mt-12 scroll-mt-6">
        <SectionHead id="preisverlauf-titel" kicker="Preisverlauf" />
        <div className="mt-4">
          <PriceChart points={points} today={today} range={range} basePath={path} />
        </div>
        {stats && stats.median30Cents !== null && stats.days30 >= 7 ? (
          <p className="mt-3 text-sm text-ink-soft">
            Median der letzten 30 Tage: {formatEuro(stats.median30Cents)} (aus {stats.days30} Tagen mit Preisdaten).
          </p>
        ) : null}
      </section>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd(p, country, offers, gtins)).replace(/</g, "\\u003c") }}
      />
    </main>
  );
}
