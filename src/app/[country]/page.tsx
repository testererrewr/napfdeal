import type { Metadata } from "next";
import Link from "next/link";
import { AdNotice, PriceDisclaimer } from "@/components/AdNotice";
import { EmptyState, SectionHead } from "@/components/editorial";
import { Bowl, FishBowl, FoodSack, LitterScoop } from "@/components/illustrations";
import { ProductList, ProductRow } from "@/components/products";
import { countryAlternates, countryInfo, isCountry, type Country } from "@/lib/countries";
import { isPreview } from "@/lib/preview";
import { countByCategory, countListed, getAnimals, getCategoryPaths, getDeals, getDrops, getLows90, getPopular } from "@/lib/queries";
import { formatLongDate } from "@/lib/site";
import { categoryPath } from "@/lib/urls";

// Reads live prices from the database on every request.
export const dynamic = "force-dynamic";

type Props = { params: Promise<{ country: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { country } = await params;
  if (!isCountry(country)) return {};
  return {
    title: `Heute im Napf – Preise für Haustierbedarf in ${countryInfo[country].name}`,
    description: `Preisvergleich für Futter, Streu, Snacks und Zubehör in ${countryInfo[country].name}: Preisverlauf, Grundpreis pro kg und Preis-Alarm.`,
    alternates: countryAlternates(country),
  };
}

const POPULAR_ANIMALS = [
  { slug: "hund", label: "Hunden" },
  { slug: "katze", label: "Katzen" },
  { slug: "kleintiere", label: "Kleintieren" },
] as const;

export default async function TodayPage({ params }: Props) {
  const { country: raw } = await params;
  const country = raw as Country; // validated in layout
  const info = countryInfo[country];
  const preview = await isPreview();
  const today = formatLongDate(new Date(), info.hreflang as "de-DE" | "de-AT");

  const [listed, deals, drops, lows, animals, counts, paths] = await Promise.all([
    countListed(country, preview),
    getDeals(country, preview),
    getDrops(country, preview),
    getLows90(country, preview),
    getAnimals(),
    countByCategory(country, preview),
    getCategoryPaths(),
  ]);
  const popular = await Promise.all(POPULAR_ANIMALS.map((a) => getPopular(country, preview, a.slug)));

  // Products per animal = products in the animal itself + in its subcategories ("hund/…").
  const animalCounts = new Map<string, number>();
  for (const [catId, n] of counts) {
    const animal = paths.get(catId)?.split("/")[0];
    if (animal) animalCounts.set(animal, (animalCounts.get(animal) ?? 0) + n);
  }

  const hasData = listed > 0;

  return (
    <main className="mx-auto max-w-[72rem] px-4 md:px-8">
      {/* Masthead */}
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-b border-ink py-2 text-sm text-ink-soft">
        <span>{today}</span>
        <span className="kicker text-ink">{info.edition}</span>
      </div>

      <div className="pb-6 pt-8 md:pt-10">
        <h1 className="text-5xl md:text-7xl" style={{ fontVariationSettings: '"SOFT" 100, "WONK" 1' }}>
          Heute im Napf
        </h1>
        <p className="mt-3 max-w-2xl text-lg text-ink-soft">
          Was Futter, Streu und Zubehör heute in {info.name} kosten, wo es billiger geworden ist und ob sich das Warten
          lohnt. Jeder Preis steht mit dem Zeitpunkt da, an dem wir ihn geprüft haben.
        </p>
        {hasData ? (
          <div className="mt-5 max-w-2xl">
            <AdNotice />
          </div>
        ) : null}
      </div>

      <div className="grid gap-10 md:grid-cols-12 md:gap-0">
        <div className="md:col-span-8 md:pr-8">
          <section aria-labelledby="aktionen">
            <SectionHead
              id="aktionen"
              kicker="Top-Aktionen heute"
              dek="Verglichen mit dem Median der letzten 30 Tage. Ein Deal braucht mindestens 7 Tage Preisverlauf."
            />
            {deals.length > 0 ? (
              <ProductList>
                {deals.map((d) => (
                  <ProductRow key={d.item.productId} item={d.item} country={country} saving={d.saving} savingKind="deal" />
                ))}
              </ProductList>
            ) : (
              <div className="mt-4">
                {hasData ? (
                  <EmptyState illustration={<Bowl className="h-14 w-14" />} title="Heute kein echter Deal.">
                    <p>
                      Kein Preis liegt gerade deutlich unter seinem 30-Tage-Median, oder wir haben noch keine 7 Tage
                      Verlauf. Wir zeigen lieber nichts als einen erfundenen Rabatt.
                    </p>
                  </EmptyState>
                ) : (
                  <EmptyState illustration={<Bowl className="h-14 w-14" />} title="Der Napf ist noch leer.">
                    <p>
                      napfdeal startet gerade. Sobald die ersten Shops angeschlossen sind, stehen hier jeden Morgen die
                      Produkte, die gegenüber ihrem üblichen Preis am stärksten gefallen sind, in Prozent und in Euro.
                    </p>
                  </EmptyState>
                )}
              </div>
            )}
          </section>

          {drops.length > 0 ? (
            <section aria-labelledby="preisstuerze" className="mt-12">
              <SectionHead id="preisstuerze" kicker="Größte Preisstürze heute" dek="Verglichen mit dem letzten Tag, an dem wir den Preis geprüft haben." />
              <ProductList>
                {drops.map((d) => (
                  <ProductRow key={d.item.productId} item={d.item} country={country} saving={d.saving} savingKind="drop" />
                ))}
              </ProductList>
            </section>
          ) : null}

          {POPULAR_ANIMALS.map((a, i) => {
            const items = popular[i] ?? [];
            if (items.length === 0) return null;
            return (
              <section key={a.slug} aria-labelledby={`beliebt-${a.slug}`} className="mt-12">
                <SectionHead id={`beliebt-${a.slug}`} kicker={`Beliebt bei ${a.label}`} dek="Die meistgeklickten Produkte der letzten 30 Tage." />
                <ProductList>
                  {items.map((item) => (
                    <ProductRow key={item.productId} item={item} country={country} />
                  ))}
                </ProductList>
              </section>
            );
          })}

          <section aria-labelledby="rubriken" className="mt-12">
            <SectionHead id="rubriken" kicker="Nach Tierart" />
            <ul className="mt-3 grid grid-cols-2 gap-x-8 sm:grid-cols-4">
              {animals.map((a) => {
                const n = animalCounts.get(a.path) ?? 0;
                return (
                  <li key={a.id} className="border-b border-dashed border-line py-2">
                    {n > 0 ? (
                      <Link href={categoryPath(country, a.path)} className="font-serif text-lg hover:text-terracotta hover:underline">
                        {a.name}
                      </Link>
                    ) : (
                      <span className="font-serif text-lg">{a.name}</span>
                    )}
                    <span className="block text-xs text-ink-soft">
                      {n > 0 ? `${n} ${n === 1 ? "Produkt" : "Produkte"}` : (a.note ?? "noch keine Produkte")}
                    </span>
                  </li>
                );
              })}
            </ul>
          </section>
        </div>

        <aside className="md:col-span-4 md:border-l md:border-ink md:pl-8" aria-label="Nebenspalte">
          <section aria-labelledby="tiefstpreise">
            <SectionHead id="tiefstpreise" kicker="Tiefstpreise seit 90 Tagen" />
            {lows.length > 0 ? (
              <ProductList>
                {lows.map((item) => (
                  <ProductRow key={item.productId} item={item} country={country} showLowNote />
                ))}
              </ProductList>
            ) : (
              <p className="mt-3 text-[0.95rem]">
                Dafür braucht es 90 Tage Preisverlauf. Wir zählen ab dem ersten Import mit und zeigen hier erst etwas
                an, wenn die Zahl stimmt.
              </p>
            )}
          </section>

          <section aria-labelledby="futterrechner" className="mt-14">
            <SectionHead id="futterrechner" kicker="Futterrechner" />
            <div className="mt-3 flex gap-3">
              <FoodSack className="h-16 w-16 shrink-0 text-ink-soft" />
              <p className="text-[0.95rem]">
                Wie lange reicht ein 12-kg-Sack bei deinem Hund, und was kostet das pro Monat im günstigsten Shop? Der
                Rechner ist in Arbeit.
              </p>
            </div>
          </section>

          <section aria-labelledby="ratgeber" className="mt-14">
            <SectionHead id="ratgeber" kicker="Ratgeber" />
            <p className="mt-3 text-[0.95rem]">
              Die ersten Artikel sind in Arbeit, zum Beispiel: Was kostet ein Hund im Monat wirklich? Und lohnt sich der
              große Sack?
            </p>
          </section>

          {hasData ? (
            <div className="mt-10">
              <PriceDisclaimer />
            </div>
          ) : null}
        </aside>
      </div>

      <section aria-labelledby="so-rechnen-wir" className="mt-16 bg-paper-deep px-5 py-8 md:px-10">
        <div className="grid gap-8 md:grid-cols-12">
          <div className="md:col-span-5">
            <h2 id="so-rechnen-wir" className="text-3xl">
              So rechnen wir
            </h2>
            <div className="mt-4 flex gap-4 text-ink-soft">
              <LitterScoop className="h-12 w-12" />
              <FishBowl className="h-12 w-12" />
            </div>
          </div>
          <dl className="grid gap-5 text-[0.95rem] md:col-span-7">
            <div>
              <dt className="font-semibold">Preis inklusive Versand</dt>
              <dd className="text-ink-soft">Wir vergleichen den Gesamtpreis, den du im Shop zahlst, nicht nur den Artikelpreis.</dd>
            </div>
            <div>
              <dt className="font-semibold">Grundpreis pro kg, Liter oder Stück</dt>
              <dd className="text-ink-soft">So siehst du, ob 6 × 400 g wirklich günstiger ist als die 2,5-kg-Dose.</dd>
            </div>
            <div>
              <dt className="font-semibold">Deals nur mit Vergleichswert</dt>
              <dd className="text-ink-soft">
                Ein Angebot gilt erst als Deal, wenn es unter dem Median der letzten 30 Tage liegt und wir mindestens 7
                Tage Preisverlauf haben. Ungewöhnliche Sprünge prüfen wir, bevor sie hier auftauchen.
              </dd>
            </div>
            <div>
              <dt className="font-semibold">Werbelinks, offen gekennzeichnet</dt>
              <dd className="text-ink-soft">
                Kaufst du über unsere Links, bekommen wir eine kleine Provision. Am Preis ändert sich für dich nichts.{" "}
                <Link href="/so-verdienen-wir-geld/" className="text-terracotta underline">
                  Alle Details
                </Link>
              </dd>
            </div>
          </dl>
        </div>
      </section>
    </main>
  );
}
