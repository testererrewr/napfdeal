import Link from "next/link";

export default function InvalidDeletePage() {
  return (
    <div className="max-w-xl">
      <h1 className="text-4xl">Nichts zu löschen</h1>
      <p className="mt-3">Dieser Link ist abgelaufen, oder die Daten sind schon gelöscht.</p>
      <p className="mt-4">
        <Link href="/" className="underline">
          Zur Startseite
        </Link>
      </p>
    </div>
  );
}
