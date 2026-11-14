import { notFound } from "next/navigation";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { COUNTRIES, isCountry } from "@/lib/countries";

export const dynamicParams = false;

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

  return (
    <>
      <SiteHeader country={country} />
      {children}
      <SiteFooter />
    </>
  );
}
