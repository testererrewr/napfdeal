import Link from "next/link";

export default function InvalidManagePage() {
  return (
    <div className="max-w-xl">
      <h1 className="text-4xl">Link nicht mehr gültig</h1>
      <p className="mt-3">Dieser Verwaltungslink ist abgelaufen. In jeder neuen Mail von uns steckt ein frischer Link.</p>
      <p className="mt-4">
        <Link href="/" className="underline">
          Zur Startseite
        </Link>
      </p>
    </div>
  );
}
