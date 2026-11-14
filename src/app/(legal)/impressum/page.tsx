import type { Metadata } from "next";
import { OPERATOR } from "@/lib/site";

export const metadata: Metadata = {
  title: "Impressum",
  alternates: { canonical: "/impressum/" },
};

// TODO: rechtlich prüfen. Vorlage, keine Rechtsberatung.
export default function ImpressumPage() {
  return (
    <>
      <h1 className="text-4xl">Impressum</h1>

      <h2>Angaben nach § 5 E-Commerce-Gesetz (ECG)</h2>
      <p>
        {OPERATOR.name}
        <br />
        {OPERATOR.street}
        <br />
        {OPERATOR.zipCity}
        <br />
        {OPERATOR.country}
      </p>
      <p>
        E-Mail: <a href={`mailto:${OPERATOR.email}`}>{OPERATOR.email}</a>
      </p>
      <p>
        Tätigkeit: Betrieb einer Website mit Preisvergleichen und Informationen rund um Haustierbedarf. Die Website wird
        über Provisionen aus Werbelinks (Affiliate-Programme) finanziert.
      </p>
      <span className="todo">
        TODO: rechtlich prüfen. Falls eine Gewerbeberechtigung besteht oder eine UID-Nummer vergeben ist, hier ergänzen:
        Gewerbe, zuständige Gewerbebehörde, Kammerzugehörigkeit, UID.
      </span>

      <h2>Offenlegung nach § 25 Mediengesetz</h2>
      <p>
        Medieninhaber: {OPERATOR.name}, Graz, {OPERATOR.country}
      </p>
      <h3>Grundlegende Richtung (Blattlinie)</h3>
      <p>
        Informationen und Preisvergleiche rund um Haustierbedarf für Tierhalterinnen und Tierhalter in Deutschland und
        Österreich.
      </p>

      <h2>Hinweis zu Preisen</h2>
      <p>
        Alle Preise werden automatisch aus Daten der Shops und Partnernetzwerke übernommen und zu dem angegebenen
        Zeitpunkt geprüft. Preise können sich seither geändert haben. Es gilt der Preis im Shop.
      </p>
    </>
  );
}
