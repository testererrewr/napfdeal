import { notFound } from "next/navigation";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { COUNTRIES, isCountry } from "@/lib/countries";
import { isPreview } from "@/lib/preview";

export function generateStaticParams() {
  return COUNTRIES.map((country) => ({ country }));
}

export default async function CountryLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ country: string }>;
}) {
  const { country } = await params;
  if (!isCountry(country)) notFound();

  const preview = await isPreview();

  return (
    <>
      {preview ? (
        <div className="bg-mustard-soft px-4 py-2 text-center text-sm">
          Vorschau: Testdaten sind sichtbar. Nur in deinem Browser.{" "}
          <a href="/vorschau/aus/" className="underline">
            Vorschau beenden
          </a>
        </div>
      ) : null}
      <SiteHeader country={country} />
      {children}
      <SiteFooter />
    </>
  );
}
