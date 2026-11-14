import Link from "next/link";
import { legalLinks } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="mt-20">
      <div className="mx-auto max-w-[72rem] px-4 md:px-8">
        <hr className="receipt-rule" />
        <div className="grid gap-6 py-8 text-sm text-ink-soft md:grid-cols-[1fr_auto]">
          <p className="max-w-md">
            napfdeal vergleicht Preise für Haustierbedarf in Deutschland und Österreich. Kostenlos für dich, finanziert
            über Werbelinks.{" "}
            <Link href="/so-verdienen-wir-geld/" className="text-ink underline">
              Wie das genau funktioniert
            </Link>
            .
          </p>
          <nav aria-label="Rechtliches">
            <ul className="flex flex-wrap gap-x-5 gap-y-2 md:justify-end">
              {legalLinks.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="hover:text-ink hover:underline">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>
    </footer>
  );
}
