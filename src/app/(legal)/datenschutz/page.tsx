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
        <li>Keine Cookies, solange du dich nicht anmeldest. Deine Länderwahl liegt nur im Speicher deines Browsers.</li>
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

      <h2>Konto</h2>
      <p>
        Wenn du ein Konto anlegst, speichern wir deine E-Mail-Adresse, dein Passwort (nur als Argon2id-Hash, nicht
        lesbar), ob die Adresse bestätigt ist, dein gewähltes Land sowie deine Merklisten und Preis-Alarme. Für die
        Anmeldung setzen wir ein Sitzungs-Cookie. IP-Adresse und Browserkennung speichern wir dabei nicht. Rechtsgrundlage
        ist die Erfüllung des Nutzungsvertrags (Art. 6 Abs. 1 lit. b DSGVO). Wir speichern die Daten, bis du das Konto
        löschst. Ein Konto ist ab 16 Jahren möglich.
      </p>

      <h3>Anmeldung mit Google oder Discord</h3>
      <p>
        Wählst du „Weiter mit Google“ oder „Weiter mit Discord“, leiten wir dich zu Google Ireland Limited (Gordon House,
        Barrow Street, Dublin 4, Irland) bzw. Discord Netherlands BV (Schiphol Boulevard 195, 1118 BG Schiphol,
        Niederlande) weiter. Wir erhalten nur deine E-Mail-Adresse, ob sie bestätigt ist, deinen Namen und eine Kennung
        (Berechtigungen „openid email profile“ bzw. „identify email“). Ein Profilbild speichern wir nicht. Die Anbieter
        können Daten in die USA übermitteln; beide berufen sich auf das EU-US Data Privacy Framework. Rechtsgrundlage ist
        Art. 6 Abs. 1 lit. b DSGVO.
      </p>
      <span className="todo">TODO: rechtlich prüfen (Anbieter-Anschriften und Drittlandübermittlung aktuell halten).</span>

      <h2>Preis-Alarm ohne Konto</h2>
      <p>
        Für einen Preis-Alarm ohne Konto speichern wir deine E-Mail-Adresse und die Bedingungen des Alarms. Jeder Alarm
        wird erst aktiv, wenn du ihn über den Link in unserer Bestätigungsmail bestätigst (Double-Opt-in).
        Unbestätigte Alarme löschen wir nach 48 Stunden, eine Adresse ohne Alarme ebenfalls. Rechtsgrundlage ist deine
        Einwilligung (Art. 6 Abs. 1 lit. a DSGVO), die du jederzeit widerrufen kannst: Jede Mail enthält Links zum
        Löschen eines Alarms und aller deiner Daten.
      </p>
      <p>
        Gegen Missbrauch begrenzen wir, wie viele Alarme in kurzer Zeit angelegt werden. Dafür halten wir deine
        IP-Adresse höchstens eine Stunde im Arbeitsspeicher, nie auf der Festplatte.
      </p>

      <h2>E-Mail-Versand</h2>
      <p>
        Bestätigungs- und Benachrichtigungsmails verschicken wir über Brevo (Sendinblue SAS, 106 boulevard Haussmann,
        75008 Paris, Frankreich) als Auftragsverarbeiter. Brevo verarbeitet dafür deine E-Mail-Adresse und den Inhalt der
        Mail. Unsere Mails enthalten keine Zählpixel.
      </p>
      <span className="todo">TODO: AV-Vertrag mit Brevo abschließen; Klick- und Öffnungs-Tracking im Brevo-Konto ausschalten.</span>

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
        Benachrichtigungen über Discord und Browser-Push sowie Datenexport und Löschen per Klick ergänzen wir hier, bevor
        die jeweilige Funktion startet.
      </p>
    </>
  );
}
