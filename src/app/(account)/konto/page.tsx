import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createListAction, deleteListAction, renameListAction, setCountryAction } from "@/app/actions/account";
import { userAlertCommandAction } from "@/app/actions/alerts";
import { AlertList } from "@/components/account/AlertList";
import { LinkSocialButton, SignOutButton } from "@/components/account/AuthForms";
import { SectionHead } from "@/components/editorial";
import { getLinkedProviders, getUserAlerts, getUserWatchlists } from "@/lib/account-queries";
import { socialLoginsEnabled } from "@/lib/auth";
import { getSessionUser } from "@/lib/auth/session";
import { COUNTRIES, countryInfo } from "@/lib/countries";
import { OPERATOR } from "@/lib/site";

export const metadata: Metadata = { title: "Dein Konto" };
export const dynamic = "force-dynamic";

const field = "rounded-sm border border-ink/40 bg-white px-3 py-1.5 focus:border-ink focus:outline-none";
const smallBtn = "rounded-sm border border-ink px-3 py-1.5 text-sm hover:bg-paper-deep";

export default async function AccountPage() {
  const u = await getSessionUser();
  if (!u) redirect("/anmelden/?next=/konto/");

  const [lists, alerts, providers] = await Promise.all([getUserWatchlists(u.id), getUserAlerts(u.id), getLinkedProviders(u.id)]);
  const social = socialLoginsEnabled();

  return (
    <div className="grid gap-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl">Dein Konto</h1>
          <p className="mt-1 text-ink-soft">{u.email}</p>
        </div>
        <SignOutButton />
      </div>

      <section aria-labelledby="merklisten" id="merklisten">
        <SectionHead id="merklisten-titel" kicker="Merklisten" dek="Zum Beispiel eine Liste pro Tier oder eine für den Vorrat." />
        {lists.length > 0 ? (
          <ul className="mt-2">
            {lists.map((l) => (
              <li key={l.id} className="flex flex-wrap items-center justify-between gap-3 border-b border-dashed border-line py-3">
                <Link href={`/konto/merkliste/${l.id}/`} className="font-serif text-lg hover:text-terracotta hover:underline">
                  {l.name}
                  <span className="ml-2 font-sans text-sm text-ink-soft">
                    {l.items} {l.items === 1 ? "Produkt" : "Produkte"}
                  </span>
                </Link>
                <div className="flex flex-wrap gap-2">
                  <form action={renameListAction} className="flex gap-2">
                    <input type="hidden" name="listId" value={l.id} />
                    <label className="sr-only" htmlFor={`rename-${l.id}`}>
                      Neuer Name für {l.name}
                    </label>
                    <input id={`rename-${l.id}`} name="name" defaultValue={l.name} maxLength={60} className={`${field} w-40 text-sm`} />
                    <button type="submit" className={smallBtn}>
                      Umbenennen
                    </button>
                  </form>
                  <form action={deleteListAction}>
                    <input type="hidden" name="listId" value={l.id} />
                    <button type="submit" className="rounded-sm border border-alarm px-3 py-1.5 text-sm text-alarm hover:bg-terracotta-soft">
                      Löschen
                    </button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-ink-soft">Noch keine Merkliste. Auf jeder Produktseite gibt es den Knopf „Merken“.</p>
        )}
        <form action={createListAction} className="mt-4 flex flex-wrap gap-2">
          <label className="sr-only" htmlFor="new-list">
            Name der neuen Liste
          </label>
          <input id="new-list" name="name" placeholder="z. B. Bello" maxLength={60} className={field} />
          <button type="submit" className={smallBtn}>
            Neue Liste
          </button>
        </form>
      </section>

      <section aria-labelledby="alarme-titel" id="alarme">
        <SectionHead id="alarme-titel" kicker="Preis-Alarme" dek="Pro Produkt und Kanal schicken wir höchstens eine Nachricht in 24 Stunden." />
        <div className="mt-2">
          <AlertList alerts={alerts} action={userAlertCommandAction} />
        </div>
      </section>

      <section aria-labelledby="kanaele-titel">
        <SectionHead id="kanaele-titel" kicker="Benachrichtigungen" />
        <ul className="mt-3 grid gap-2 text-[0.95rem]">
          <li>
            <strong>E-Mail:</strong> aktiv an {u.email}
          </li>
          <li className="text-ink-soft">
            <strong className="text-ink">Discord</strong> und <strong className="text-ink">Browser-Push</strong> kommen mit dem nächsten Update.
          </li>
        </ul>
      </section>

      <section aria-labelledby="land-titel" id="land">
        <SectionHead id="land-titel" kicker="Land" dek="Für Merklisten-Preise und neue Preis-Alarme." />
        <form action={setCountryAction} className="mt-3 flex flex-wrap items-center gap-3">
          {COUNTRIES.map((c) => (
            <label key={c} className="flex items-center gap-2">
              <input type="radio" name="country" value={c} defaultChecked={(u.country ?? "de") === c} />
              {countryInfo[c].name}
            </label>
          ))}
          <button type="submit" className={smallBtn}>
            Speichern
          </button>
        </form>
      </section>

      <section aria-labelledby="logins-titel">
        <SectionHead id="logins-titel" kicker="Anmeldewege" />
        <ul className="mt-3 grid gap-2 text-[0.95rem]">
          <li>E-Mail und Passwort: {providers.includes("credential") ? "eingerichtet" : "nicht eingerichtet"}</li>
          {social.google ? (
            <li className="flex flex-wrap items-center gap-3">
              Google: {providers.includes("google") ? "verknüpft" : <LinkSocialButton provider="google" label="Mit Google verknüpfen" />}
            </li>
          ) : null}
          {social.discord ? (
            <li className="flex flex-wrap items-center gap-3">
              Discord: {providers.includes("discord") ? "verknüpft" : <LinkSocialButton provider="discord" label="Mit Discord verknüpfen" />}
            </li>
          ) : null}
        </ul>
      </section>

      <section aria-labelledby="daten-titel">
        <SectionHead id="daten-titel" kicker="Meine Daten" />
        <p className="mt-3 max-w-2xl text-[0.95rem]">
          Herunterladen und vollständiges Löschen per Klick kommen mit dem nächsten Update. Bis dahin genügt eine kurze Mail
          an <a href={`mailto:${OPERATOR.email}`} className="underline">{OPERATOR.email}</a>, dann erledigen wir das von Hand.
        </p>
      </section>
    </div>
  );
}
