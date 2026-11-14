"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Flag } from "@/components/Flags";
import { COUNTRIES, COUNTRY_STORAGE_KEY, countryInfo, type Country } from "@/lib/countries";

export function rememberCountry(country: Country) {
  try {
    window.localStorage.setItem(COUNTRY_STORAGE_KEY, country);
  } catch {
    // Storage may be unavailable (private mode, blocked). The choice then just isn't remembered.
  }
}

/** Swaps the /de/ or /at/ prefix of the current path; falls back to the country home. */
function targetPath(pathname: string, to: Country): string {
  const match = pathname.match(/^\/(de|at)(\/.*)?$/);
  if (match) return `/${to}${match[2] ?? "/"}`;
  return `/${to}/`;
}

export function CountrySwitch({ current }: { current?: Country }) {
  const pathname = usePathname() ?? "/";

  return (
    <nav aria-label="Land wählen" className="flex items-center gap-1 text-sm">
      {COUNTRIES.map((c) => {
        const active = c === current;
        return (
          <Link
            key={c}
            href={targetPath(pathname, c)}
            hrefLang={countryInfo[c].hreflang}
            onClick={() => rememberCountry(c)}
            aria-current={active ? "page" : undefined}
            className={`inline-flex items-center gap-1.5 rounded-sm px-2 py-1 font-semibold uppercase tracking-wide ${
              active ? "bg-ink text-paper" : "text-ink-soft hover:text-ink"
            }`}
          >
            <Flag country={c} className="h-3 w-[1.1rem] ring-1 ring-ink/20" />
            <span>{c}</span>
            <span className="sr-only">{countryInfo[c].name}</span>
          </Link>
        );
      })}
    </nav>
  );
}
