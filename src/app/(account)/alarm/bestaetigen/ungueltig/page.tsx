import Link from "next/link";

export default function InvalidConfirmPage() {
  return (
    <div className="max-w-xl">
      <h1 className="text-4xl">Link nicht mehr gültig</h1>
      <p className="mt-3">
        Dieser Bestätigungslink ist abgelaufen oder wurde schon benutzt. Leg den Alarm einfach auf der Produktseite neu an.
      </p>
      <p className="mt-4">
        <Link href="/" className="underline">
          Zur Startseite
        </Link>
      </p>
    </div>
  );
}
