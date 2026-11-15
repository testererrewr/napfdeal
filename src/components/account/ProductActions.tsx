import Link from "next/link";
import { addToListAction } from "@/app/actions/account";
import { AlertForm } from "@/components/account/AlertForm";
import { getListsForSelect } from "@/lib/account-queries";
import { getSessionUser } from "@/lib/auth/session";
import type { Country } from "@/lib/countries";

/** "Merken" and "Preis-Alarm" on product pages. */
export async function ProductActions({
  productId,
  country,
  backPath,
  bestCents,
  savedTo,
}: {
  productId: number;
  country: Country;
  backPath: string;
  bestCents: number | null;
  savedTo: string | null;
}) {
  const u = await getSessionUser();
  const lists = u ? await getListsForSelect(u.id) : [];
  // Suggest a target 5 % below today's best total, rounded down to 10 cents.
  const suggested = bestCents ? (Math.floor((bestCents * 0.95) / 10) / 10).toFixed(2).replace(".", ",") : "";
  const savedList = savedTo ? lists.find((l) => String(l.id) === savedTo) : undefined;

  return (
    <div className="mt-6 grid gap-3">
      <div className="flex flex-wrap items-center gap-3">
        {u ? (
          <form action={addToListAction} className="flex flex-wrap items-center gap-2">
            <input type="hidden" name="productId" value={productId} />
            <input type="hidden" name="back" value={backPath} />
            {lists.length > 1 ? (
              <>
                <label htmlFor="listId" className="sr-only">
                  Merkliste
                </label>
                <select id="listId" name="listId" className="rounded-sm border border-ink/40 bg-white px-2 py-2 text-sm">
                  {lists.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name}
                    </option>
                  ))}
                  <option value="new">Neue Liste …</option>
                </select>
              </>
            ) : (
              <input type="hidden" name="listId" value={lists[0]?.id ?? "new"} />
            )}
            <button type="submit" className="rounded-sm border border-ink px-3 py-2 text-sm font-semibold hover:bg-paper-deep">
              Merken
            </button>
          </form>
        ) : (
          <Link href={`/anmelden/?next=${encodeURIComponent(backPath)}`} className="rounded-sm border border-ink px-3 py-2 text-sm font-semibold hover:bg-paper-deep">
            Merken (mit Konto)
          </Link>
        )}
        {savedList ? (
          <span role="status" className="text-sm text-moss">
            Gemerkt in <Link href={`/konto/merkliste/${savedList.id}/`} className="underline">{savedList.name}</Link>.
          </span>
        ) : null}
      </div>

      <details className="max-w-2xl border border-ink/30 bg-paper px-4 py-3 open:bg-paper-deep/40">
        <summary className="cursor-pointer font-semibold">Preis-Alarm anlegen</summary>
        <p className="mt-2 text-sm text-ink-soft">
          Wir prüfen die Preise mindestens zweimal am Tag und melden uns, wenn deine Bedingung erfüllt ist. Höchstens eine
          Nachricht pro Tag für dieses Produkt.
          {u ? null : " Ohne Konto bestätigst du jeden Alarm einmal per Mail."}
        </p>
        <div className="mt-4">
          <AlertForm productId={productId} country={country} suggestedTarget={suggested} loggedIn={Boolean(u)} />
        </div>
      </details>
    </div>
  );
}
