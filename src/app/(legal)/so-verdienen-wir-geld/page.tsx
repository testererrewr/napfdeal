import type { Metadata } from "next";
import { OPERATOR } from "@/lib/site";

export const metadata: Metadata = {
  title: "So verdienen wir Geld",
  description: "Wie napfdeal finanziert wird, woher die Preise kommen und wie wir Deals berechnen.",
  alternates: { canonical: "/so-verdienen-wir-geld/" },
};

export default function TransparencyPage() {
  return (
    <>
      <h1 className="text-4xl">So verdienen wir Geld</h1>
      <p className="text-lg">
        napfdeal ist für dich kostenlos. Damit das so bleibt, bekommen wir Geld auf zwei Wegen. Beide sind auf der Seite
        immer gekennzeichnet.
      </p>

      <h2>1. Werbelinks (Affiliate)</h2>
      <p>
        Die Buttons „Zum Shop“ sind Werbelinks. Kaufst du nach einem Klick etwas, zahlt uns der Shop über ein
        Partnernetzwerk eine kleine Provision. Für dich ändert sich am Preis nichts. Jeder dieser Links ist mit
        „Werbelink“ markiert.
      </p>
      <p>
        Wie viel Provision ein Shop zahlt, hat keinen Einfluss auf die Reihenfolge. Die Preistabelle ist immer nach dem
        Gesamtpreis inklusive Versand sortiert.
      </p>

      <h2>2. Partner-Banner</h2>
      <p>
        Gelegentlich zeigen wir ein Banner eines Partners. Es ist mit „Anzeige“ gekennzeichnet, kommt von unserem eigenen
        Server und enthält keine Tracking-Pixel oder fremden Skripte.
      </p>

      <h2>Woher die Preise kommen</h2>
      <p>
        Die Shops stellen ihre Produkte und Preise über Partnernetzwerke als Datenfeeds bereit. Wir lesen diese Feeds
        mindestens zweimal täglich ein und schreiben bei jedem Preis dazu, wann wir ihn geprüft haben. Preise können sich
        seither geändert haben. Es gilt der Preis im Shop.
      </p>
      <p>
        Gleiche Produkte aus verschiedenen Shops ordnen wir über die EAN (die Nummer unter dem Strichcode) zu. Ohne EAN
        führen wir nichts automatisch zusammen, sondern prüfen es von Hand.
      </p>

      <h2>Wie wir Deals berechnen</h2>
      <ul>
        <li>Verglichen wird der aktuelle Gesamtpreis mit dem Median der letzten 30 Tage im selben Shop.</li>
        <li>Ein Deal braucht mindestens 7 Tage Preisverlauf. Vorher gibt es kein Deal-Label.</li>
        <li>
          Fällt ein Preis in einem Schritt extrem (zum Beispiel um 80 %), zeigen wir ihn erst als Deal, wenn der nächste
          Import ihn bestätigt oder wir ihn von Hand geprüft haben. Das schützt vor Feed-Fehlern.
        </li>
        <li>Keine künstliche Eile: Wir schreiben nie „nur noch heute“, wenn wir das nicht wissen.</li>
      </ul>

      <h2>Wer dahintersteht</h2>
      <p>
        napfdeal wird von {OPERATOR.name} aus Graz betrieben. Fragen, Fehler in Preisen oder Hinweise gern an{" "}
        <a href={`mailto:${OPERATOR.email}`}>{OPERATOR.email}</a>.
      </p>
    </>
  );
}
