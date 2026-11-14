import type { Metadata } from "next";
import { OPERATOR } from "@/lib/site";

export const metadata: Metadata = {
  title: "Nutzungsbedingungen",
  alternates: { canonical: "/nutzungsbedingungen/" },
};

// TODO: rechtlich prüfen. Vorlage, keine Rechtsberatung.
export default function TermsPage() {
  return (
    <>
      <h1 className="text-4xl">Nutzungsbedingungen</h1>
      <p className="text-ink-soft">Stand: November 2026</p>

      <h2>1. Was napfdeal ist</h2>
      <p>
        napfdeal.com ist ein kostenloser Preisvergleich für Haustierbedarf. Wir verkaufen selbst nichts. Kaufverträge
        schließt du direkt mit dem jeweiligen Shop ab, zu dessen Bedingungen.
      </p>

      <h2>2. Preise und Angaben</h2>
      <p>
        Preise, Verfügbarkeit und Produktangaben übernehmen wir automatisch von Shops und Partnernetzwerken und zeigen
        jeweils, wann wir sie geprüft haben. Sie können sich seither geändert haben oder fehlerhaft sein. Verbindlich ist
        immer der Preis im Shop zum Zeitpunkt deiner Bestellung.
      </p>

      <h2>3. Keine Beratung</h2>
      <p>
        Inhalte zu Futtermengen, Ernährung oder Gesundheit sind allgemeine Informationen und ersetzen keine tierärztliche
        Beratung.
      </p>

      <h2>4. Faire Nutzung</h2>
      <p>
        Bitte nutze napfdeal nicht automatisiert in einem Umfang, der den Betrieb stört, und versuche nicht, Sicherheits-
        oder Missbrauchsschutz zu umgehen.
      </p>

      <h2>5. Haftung</h2>
      <p>
        Wir geben uns Mühe, dass alles stimmt, können aber keine Gewähr für Richtigkeit und Vollständigkeit übernehmen.
        Für Inhalte verlinkter Shops sind deren Betreiber verantwortlich. Gesetzlich zwingende Haftung bleibt unberührt.
      </p>
      <span className="todo">TODO: rechtlich prüfen (Haftungsausschluss nach österreichischem Recht, Verbraucherschutz).</span>

      <h2>6. Änderungen und Kontakt</h2>
      <p>
        Wenn sich diese Bedingungen ändern, steht das hier mit neuem Datum. Fragen an{" "}
        <a href={`mailto:${OPERATOR.email}`}>{OPERATOR.email}</a>.
      </p>
      <p>Es gilt österreichisches Recht, soweit zwingende Verbraucherschutzvorschriften nichts anderes bestimmen.</p>
    </>
  );
}
