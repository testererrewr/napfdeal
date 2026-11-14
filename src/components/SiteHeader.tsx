import Link from "next/link";
import { CountrySwitch } from "@/components/CountrySwitch";
import { Wordmark } from "@/components/Wordmark";
import type { Country } from "@/lib/countries";

export function SiteHeader({ country }: { country?: Country }) {
  return (
    <header className="border-b border-ink">
      <div className="mx-auto flex max-w-[72rem] items-center justify-between gap-4 px-4 py-3 md:px-8">
        <Link href={country ? `/${country}/` : "/"} className="text-[1.65rem] no-underline" aria-label="napfdeal Startseite">
          <Wordmark />
        </Link>
        <CountrySwitch current={country} />
      </div>
    </header>
  );
}
