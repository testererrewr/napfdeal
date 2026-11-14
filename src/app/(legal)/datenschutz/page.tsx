import type { Metadata } from "next";
import Link from "next/link";
import { OPERATOR } from "@/lib/site";

export const metadata: Metadata = {
  title: "Datenschutzerklärung",
  alternates: { canonical: "/datenschutz/" },
};

// Version for the current feature set (Phase 0: no accounts, no alerts, no outgoing affiliate links yet).
// Phase 5 extends this to cover accounts, alerts, mail, Discord, Google login, push, affiliate redirects, backups.
// TODO: rechtlich prüfen. Vorlage, keine Rechtsberatung.
export default function DatenschutzPage() {
  return (
    <>
      <h1 className="text-4xl">Datenschutzerklärung</h1>
      <p className="text-ink-soft">Stand: November 2026</p>

      <h2>Kurz gesagt</h2>
      <ul>
        <li>Keine Tracker, keine Werbeskripte, keine Analyse-Dienste.</li>
        <li>Keine Cookies. Nur deine Länderwahl liegt im Speicher deines Browsers.</li>
        <li>Schriften und alle anderen Dateien kommen von unserem eigenen Server.</li>
        <li>Wir speichern keine IP-Adressen in Zugriffsprotokollen.</li>
      </ul>

      <h2>Verantwortlicher</h2>
      <p>
        {OPERATOR.name}
        <br />
        {OPERATOR.street}, {OPERATOR.zipCity}, {OPERATOR.country}
        <br />
        E-Mail: <a href={`mailto:${OPERATOR.email}`}>{OPERATOR.email}</a>
      </p>

      <h2>Aufruf der Website</h2>
      <p>
        Wenn du napfdeal.com aufrufst, überträgt dein Browser technisch notwendige Daten an unseren Server, unter
        anderem deine IP-Adresse, die aufgerufene Adresse, Datum und Uhrzeit sowie Browserangaben. Diese Daten werden
        nur verarbeitet, um die Seite auszuliefern und den Betrieb sicher zu halten.
      </p>
      <ul>
        <li>
          <strong>Zugriffsprotokolle:</strong> Unser Webserver führt keine Zugriffsprotokolle mit IP-Adressen.
          Fehlermeldungen der Anwendung enthalten keine personenbezogenen Daten.
        </li>
        <li>
          <strong>Schutz vor Missbrauch:</strong> Für Begrenzungen gegen Missbrauch (zum Beispiel zu viele Anfragen in
          kurzer Zeit) kann die IP-Adresse kurzzeitig im Arbeitsspeicher gehalten werden. Sie wird nicht dauerhaft
          gespeichert.
        </li>
        <li>
          <strong>Rechtsgrundlage:</strong> berechtigtes Interesse an einem sicheren und funktionierenden Angebot (Art. 6
          Abs. 1 lit. f DSGVO).
        </li>
      </ul>

      <h2>Hosting</h2>
      <p>
        Die Website läuft auf einem gemieteten Server der netcup GmbH, Emmy-Noether-Straße 10, 76131 Karlsruhe,
        Deutschland. netcup verarbeitet die oben genannten Daten in unserem Auftrag (Auftragsverarbeitung nach Art. 28
        DSGVO). Der Server steht in der EU.
      </p>
      <span className="todo">
        TODO: Serverstandort prüfen (netcup-Kundenbereich) und AV-Vertrag im netcup-Kundenbereich (CCP) abschließen.
      </span>

      <h2>Speicher im Browser (localStorage)</h2>
      <p>
        Wenn du ein Land wählst, speichern wir „de“ oder „at“ im lokalen Speicher deines Browsers, damit du beim
        nächsten Besuch direkt in deinem Land landest. Der Wert verlässt deinen Browser nicht und ist technisch
        notwendig für die von dir gewünschte Funktion (§ 165 Abs. 3 TKG 2021 bzw. § 25 Abs. 2 TDDDG). Du kannst ihn
        jederzeit in deinem Browser löschen. Details:{" "}
        <Link href="/cookies-und-speicher/">Cookies &amp; Speicher</Link>.
      </p>

      <h2>Klick auf einen Werbelink</h2>
      <p>
        Alle Links zu Shops führen zuerst über napfdeal.com (Adressen wie /go/123/) und leiten dich dann zum Shop bzw.
        zum Partnernetzwerk weiter. Dabei zählen wir nur: welches Angebot, an welchem Tag, in welchem Land und aus
        welchem Bereich (z. B. Website oder E-Mail) geklickt wurde. Wir speichern dabei weder deine IP-Adresse noch eine
        Kennung von dir. Zweck ist die Abrechnung und Verbesserung des Angebots (Art. 6 Abs. 1 lit. f DSGVO).
      </p>
      <p>
        Nach der Weiterleitung bist du beim Partnernetzwerk (zum Beispiel Awin AG, Deutschland) und beim Shop. Diese
        verarbeiten deine Daten in eigener Verantwortung, etwa um die Provision zuzuordnen, und können dafür Cookies
        setzen. Es gelten deren Datenschutzhinweise.
      </p>

      <h2>Produktbilder</h2>
      <p>
        Produktbilder laden wir auf unserem Server von den Shops und liefern sie selbst aus. Dein Browser nimmt dafür
        keinen Kontakt zu den Shops auf.
      </p>

      <h2>Kontakt per E-Mail</h2>
      <p>
        Wenn du uns schreibst, verarbeiten wir deine Nachricht und Adresse, um zu antworten (Art. 6 Abs. 1 lit. b oder f
        DSGVO). Wir löschen die Korrespondenz, wenn sie erledigt ist und keine Aufbewahrungspflicht besteht. Für das
        Postfach nutzen wir Gmail von Google.
      </p>
      <span className="todo">
        TODO: rechtlich prüfen. Gmail-Postfach bedeutet Verarbeitung durch Google (ggf. Drittland USA, EU-US Data
        Privacy Framework). Alternative: Postfach bei einem EU-Anbieter unter @napfdeal.com.
      </span>

      <h2>Deine Rechte</h2>
      <p>
        Du hast das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung, Datenübertragbarkeit und
        Widerspruch (Art. 15 bis 21 DSGVO). Schreib dafür einfach an{" "}
        <a href={`mailto:${OPERATOR.email}`}>{OPERATOR.email}</a>.
      </p>
      <p>
        Du kannst dich außerdem bei der Aufsichtsbehörde beschweren. In Österreich ist das die Datenschutzbehörde,
        Barichgasse 40–42, 1030 Wien, <a href="https://www.dsb.gv.at">www.dsb.gv.at</a>.
      </p>

      <h2>Was noch dazukommt</h2>
      <p>
        Sobald es Konten, Preis-Alarme, Benachrichtigungen und Links zu Shops gibt, ergänzen wir diese Erklärung vor dem
        Start der jeweiligen Funktion.
      </p>
    </>
  );
}
