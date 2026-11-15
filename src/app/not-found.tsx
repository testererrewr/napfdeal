import Link from "next/link";
import { Bowl } from "@/components/illustrations";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";

export default function NotFound() {
  return (
    <>
      <SiteHeader showAccount={false} />
      <main className="mx-auto max-w-[72rem] px-4 py-16 md:px-8">
        <Bowl className="h-20 w-20 text-ink-soft" />
        <h1 className="mt-4 text-4xl">Diese Seite gibt es nicht.</h1>
        <p className="mt-3 max-w-lg text-ink-soft">
          Vielleicht wurde das Produkt umbenannt oder der Link ist alt.{" "}
          <Link href="/" className="text-terracotta underline">
            Zur Startseite
          </Link>
        </p>
      </main>
      <SiteFooter />
    </>
  );
}
