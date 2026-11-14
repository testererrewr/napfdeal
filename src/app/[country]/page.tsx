import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState, HandNote, SectionHead } from "@/components/editorial";
import { Bowl, FishBowl, FoodSack, LitterScoop } from "@/components/illustrations";
import { ANIMALS } from "@/lib/categories";
import { countryAlternates, countryInfo, isCountry, type Country } from "@/lib/countries";
import { formatLongDate } from "@/lib/site";

// Re-render at most every 10 minutes so the masthead date stays current.
// From Phase 2 on, this page reads deals from the database.
export const revalidate = 600;

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

export default async function TodayPage({ params }: Props) {
  const { country: raw } = await params;
  const country = raw as Country; // validated in layout
  const info = countryInfo[country];
  const today = formatLongDate(new Date(), info.hreflang as "de-DE" | "de-AT");

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
      </div>

      {/* Newspaper grid: wide main column, narrow side column with vertical rule */}
      <div className="grid gap-10 md:grid-cols-12 md:gap-0">
        <section aria-labelledby="preisstuerze" className="md:col-span-8 md:pr-8">
          <SectionHead
            id="preisstuerze"
            kicker="Größte Preisstürze heute"
            dek="Verglichen mit dem Median der letzten 30 Tage. Ein Deal braucht mindestens 7 Tage Preisverlauf."
          />
          <div className="mt-4">
            <EmptyState
              illustration={<Bowl className="h-14 w-14" />}
              title="Der Napf ist noch leer."
            >
              <p>
                napfdeal startet gerade. Sobald die ersten Shops angeschlossen sind, stehen hier jeden Morgen die
                Produkte, die gegenüber ihrem üblichen Preis am stärksten gefallen sind, in Prozent und in Euro.
              </p>
            </EmptyState>
          </div>

          <div className="mt-12">
            <SectionHead id="rubriken" kicker="Nach Tierart" />
            <ul className="mt-3 grid grid-cols-2 gap-x-8 sm:grid-cols-4" aria-labelledby="rubriken">
              {ANIMALS.map((a) => (
                <li key={a.slug} className="border-b border-dashed border-line py-2">
                  <span className="font-serif text-lg">{a.name}</span>
                  {a.note ? <span className="block text-xs text-ink-soft">{a.note}</span> : null}
                </li>
              ))}
            </ul>
            <p className="mt-2 text-sm text-ink-soft">Die Rubriken werden verlinkt, sobald die ersten Produkte da sind.</p>
          </div>
        </section>

        <aside className="md:col-span-4 md:border-l md:border-ink md:pl-8" aria-label="Nebenspalte">
          <section aria-labelledby="tiefstpreise">
            <SectionHead id="tiefstpreise" kicker="Tiefstpreise seit 90 Tagen" />
            <p className="mt-3 text-[0.95rem]">
              Dafür braucht es 90 Tage Preisverlauf. Wir zählen ab dem ersten Import mit und zeigen hier erst etwas an,
              wenn die Zahl stimmt.
            </p>
            <div className="mt-4 pl-10">
              <HandNote>ab Tag 90 hier</HandNote>
            </div>
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
        </aside>
      </div>

      {/* How we work – real content, no data needed */}
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
              <dd className="text-ink-soft">
                Wir vergleichen den Gesamtpreis, den du im Shop zahlst, nicht nur den Artikelpreis.
              </dd>
            </div>
            <div>
              <dt className="font-semibold">Grundpreis pro kg, Liter oder Stück</dt>
              <dd className="text-ink-soft">
                So siehst du, ob 6 × 400 g wirklich günstiger ist als die 2,5-kg-Dose.
              </dd>
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
