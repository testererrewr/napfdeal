import Link from "next/link";
import type { AlertRow } from "@/lib/account-queries";
import { describeCondition } from "@/lib/alert-rules";
import { isCountry } from "@/lib/countries";
import { formatCheckedAt } from "@/lib/format";
import { productPath } from "@/lib/urls";

const STATUS: Record<string, string> = {
  pending: "wartet auf Bestätigung",
  active: "aktiv",
  paused: "pausiert",
};

/**
 * Alert table with pause / resume / delete. `action` is a server action; `token` (guests) is
 * passed along as hidden field.
 */
export function AlertList({
  alerts,
  action,
  token,
}: {
  alerts: AlertRow[];
  action: (fd: FormData) => Promise<void>;
  token?: string;
}) {
  if (alerts.length === 0) return <p className="text-ink-soft">Keine Preis-Alarme.</p>;
  return (
    <ul>
      {alerts.map((a) => {
        const country = isCountry(a.country) ? a.country : "de";
        return (
          <li key={a.id} className="flex flex-wrap items-start justify-between gap-3 border-b border-dashed border-line py-3">
            <div className="min-w-0">
              <Link href={productPath(country, a.categoryPath, a.productSlug)} className="font-semibold hover:underline">
                {a.productName}
              </Link>
              <p className="text-sm">{describeCondition(a)}</p>
              <p className="text-xs text-ink-soft">
                {a.country.toUpperCase()} · per E-Mail{a.digest ? " (Tageszusammenfassung)" : ""} · {STATUS[a.status] ?? a.status}
                {a.lastNotifiedAt ? ` · zuletzt benachrichtigt ${formatCheckedAt(a.lastNotifiedAt)}` : ""}
              </p>
            </div>
            <div className="flex gap-2">
              {a.status === "active" || a.status === "paused" ? (
                <form action={action}>
                  {token ? <input type="hidden" name="token" value={token} /> : null}
                  <input type="hidden" name="alertId" value={a.id} />
                  <input type="hidden" name="command" value={a.status === "active" ? "pause" : "resume"} />
                  <button type="submit" className="rounded-sm border border-ink px-2 py-1 text-sm hover:bg-paper-deep">
                    {a.status === "active" ? "Pausieren" : "Fortsetzen"}
                  </button>
                </form>
              ) : null}
              <form action={action}>
                {token ? <input type="hidden" name="token" value={token} /> : null}
                <input type="hidden" name="alertId" value={a.id} />
                <input type="hidden" name="command" value="delete" />
                <button type="submit" className="rounded-sm border border-alarm px-2 py-1 text-sm text-alarm hover:bg-terracotta-soft">
                  Löschen
                </button>
              </form>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
