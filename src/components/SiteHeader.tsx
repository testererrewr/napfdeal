import { headers } from "next/headers";
import Link from "next/link";
import { CountrySwitch } from "@/components/CountrySwitch";
import { Wordmark } from "@/components/Wordmark";
import { getSessionUser } from "@/lib/auth/session";
import type { Country } from "@/lib/countries";

async function AccountLink() {
  // Read request headers outside try/catch so Next can detect the dynamic rendering correctly.
  await headers();
  let loggedIn = false;
  try {
    loggedIn = Boolean(await getSessionUser());
  } catch {
    // Header must render even if the session lookup fails.
    loggedIn = false;
  }
  return (
    <Link href={loggedIn ? "/konto/" : "/anmelden/"} className="text-sm font-semibold text-ink-soft hover:text-ink">
      {loggedIn ? "Konto" : "Anmelden"}
    </Link>
  );
}

export function SiteHeader({ country, showAccount = true }: { country?: Country; showAccount?: boolean }) {
  return (
    <header className="border-b border-ink">
      <div className="mx-auto flex max-w-[72rem] items-center justify-between gap-4 px-4 py-3 md:px-8">
        <Link href={country ? `/${country}/` : "/"} className="text-[1.65rem] no-underline" aria-label="napfdeal Startseite">
          <Wordmark />
        </Link>
        <div className="flex items-center gap-4">
          {showAccount ? <AccountLink /> : null}
          <CountrySwitch current={country} />
        </div>
      </div>
    </header>
  );
}
