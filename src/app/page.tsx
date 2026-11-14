import type { Metadata } from "next";
import Link from "next/link";
import { CountryChooser } from "@/components/CountryChooser";
import { Paw } from "@/components/illustrations";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";

export const metadata: Metadata = {
  title: { absolute: "napfdeal – Preisvergleich für Haustierbedarf in Deutschland und Österreich" },
  alternates: {
    canonical: "/",
    languages: { "de-DE": "/de/", "de-AT": "/at/", "x-default": "/" },
  },
};

export default function CountrySelectPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-[72rem] px-4 md:px-8">
        <div className="grid gap-10 py-14 md:grid-cols-12 md:py-20">
          <div className="md:col-span-7">
            <h1 className="text-4xl md:text-5xl">Wo wohnst du?</h1>
            <p className="mt-3 max-w-lg text-ink-soft">
              Preise, Versandkosten und Shops sind in Deutschland und Österreich verschieden. Wir zeigen dir nur, was in
              deinem Land gilt. Du kannst das oben jederzeit umstellen.
            </p>
            <div className="mt-8">
              <CountryChooser />
            </div>
            <p className="mt-6 text-sm text-ink-soft">
              Deine Wahl merkt sich nur dein Browser (lokaler Speicher, kein Cookie).{" "}
              <Link href="/cookies-und-speicher/" className="underline">
                Mehr dazu
              </Link>
              .
            </p>
          </div>
          <aside className="hidden md:col-span-4 md:col-start-9 md:block">
            <Paw className="ml-auto h-40 w-40 -rotate-12 text-terracotta/70" />
          </aside>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
