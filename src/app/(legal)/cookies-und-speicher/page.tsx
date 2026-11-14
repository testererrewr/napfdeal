import type { Metadata } from "next";
import { COUNTRY_STORAGE_KEY } from "@/lib/countries";

export const metadata: Metadata = {
  title: "Cookies & Speicher",
  alternates: { canonical: "/cookies-und-speicher/" },
};

// Keep this list in sync with every cookie / storage key the app writes.
// If a consent-requiring service is ever added, the prepared consent banner must be switched on (see Phase 5).
const entries = [
  {
    name: COUNTRY_STORAGE_KEY,
    type: "localStorage",
    purpose: "Merkt sich, ob du die Ausgabe Deutschland oder Österreich sehen willst.",
    content: "„de“ oder „at“",
    duration: "Bis du ihn im Browser löschst",
  },
];

export default function CookiesPage() {
  return (
    <>
      <h1 className="text-4xl">Cookies &amp; Speicher</h1>
      <p>
        napfdeal setzt derzeit <strong>keine Cookies</strong>. Wir nutzen nur einen Eintrag im lokalen Speicher deines
        Browsers, der für die Länderwahl technisch notwendig ist. Deshalb gibt es auch kein Cookie-Banner.
      </p>

      <h2>Alle Einträge</h2>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full border-collapse text-left text-[0.95rem]">
          <thead className="bg-paper-deep">
            <tr>
              <th className="p-2 font-semibold">Name</th>
              <th className="p-2 font-semibold">Art</th>
              <th className="p-2 font-semibold">Zweck</th>
              <th className="p-2 font-semibold">Inhalt</th>
              <th className="p-2 font-semibold">Dauer</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((e) => (
              <tr key={e.name} className="border-b border-dashed border-line align-top">
                <td className="p-2 font-mono text-sm">{e.name}</td>
                <td className="p-2">{e.type}</td>
                <td className="p-2">{e.purpose}</td>
                <td className="p-2">{e.content}</td>
                <td className="p-2">{e.duration}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2>Später dazukommend</h2>
      <p>
        Wenn du dich künftig einloggst, kommen ein Sitzungs-Cookie und ein Sicherheits-Token dazu. Beide sind technisch
        notwendig und werden hier aufgeführt, bevor die Funktion startet.
      </p>

      <h2>Cookies von Shops</h2>
      <p>
        Wenn du auf einen Werbelink zu einem Shop klickst, verlässt du napfdeal.com. Der Shop und das Partnernetzwerk
        können dann eigene Cookies setzen, zum Beispiel um die Provision zuzuordnen. Darauf haben wir keinen Einfluss;
        es gelten die Datenschutzhinweise des jeweiligen Shops.
      </p>
    </>
  );
}
