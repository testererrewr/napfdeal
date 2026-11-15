import Link from "next/link";

export default function DeletedPage() {
  return (
    <div className="max-w-xl">
      <h1 className="text-4xl">Gelöscht</h1>
      <p className="mt-3">Deine Adresse und alle Preis-Alarme dazu sind gelöscht. Du bekommst von uns keine Mails mehr.</p>
      <p className="mt-4">
        <Link href="/" className="underline">
          Zur Startseite
        </Link>
      </p>
    </div>
  );
}
