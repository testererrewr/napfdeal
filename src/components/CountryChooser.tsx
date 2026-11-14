"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { rememberCountry } from "@/components/CountrySwitch";
import { Flag } from "@/components/Flags";
import { COUNTRIES, COUNTRY_STORAGE_KEY, countryInfo, isCountry } from "@/lib/countries";

/**
 * First visit: ask where the visitor lives. The choice is stored in localStorage (no cookie).
 * Works without JavaScript too – the choices are plain links.
 */
export function CountryChooser() {
  const router = useRouter();

  useEffect(() => {
    let stored: string | null = null;
    try {
      stored = window.localStorage.getItem(COUNTRY_STORAGE_KEY);
    } catch {
      stored = null;
    }
    if (isCountry(stored)) router.replace(`/${stored}/`);
  }, [router]);

  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {COUNTRIES.map((c) => (
        <li key={c}>
          <Link
            href={`/${c}/`}
            hrefLang={countryInfo[c].hreflang}
            onClick={() => rememberCountry(c)}
            className="group flex items-center gap-4 rounded-sm border border-ink bg-paper px-5 py-4 no-underline transition-colors hover:bg-ink hover:text-paper"
          >
            <Flag country={c} className="h-6 w-9 shrink-0 ring-1 ring-ink/20" />
            <span>
              <span className="block font-serif text-2xl">{countryInfo[c].name}</span>
              <span className="block text-sm text-ink-soft group-hover:text-paper/80">{countryInfo[c].shopsIn}</span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
