import type { Metadata } from "next";
import Link from "next/link";
import { eq } from "drizzle-orm";
import { confirmAlertAction } from "@/app/actions/alerts";
import { describeCondition } from "@/lib/alert-rules";
import { getDb } from "@/lib/db";
import { alert, product } from "@/lib/db/schema";
import { readToken } from "@/lib/tokens";

export const metadata: Metadata = { title: "Preis-Alarm bestätigen" };
export const dynamic = "force-dynamic";

/**
 * Landing page from the confirmation mail. Confirming needs a button click (not just opening the link),
 * so mail security scanners that prefetch links can't confirm on someone's behalf.
 */
export default async function ConfirmAlertPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const t = await readToken(token, "alert_confirm");
  const rows = t?.alertId
    ? await getDb()
        .select({
          kind: alert.kind,
          targetCents: alert.targetCents,
          includeShipping: alert.includeShipping,
          minDropPercent: alert.minDropPercent,
          minDropCents: alert.minDropCents,
          backInStock: alert.backInStock,
          productName: product.name,
        })
        .from(alert)
        .innerJoin(product, eq(product.id, alert.productId))
        .where(eq(alert.id, t.alertId))
        .limit(1)
    : [];
  const a = rows[0];

  if (!t || !a) {
    return (
      <div className="max-w-xl">
        <h1 className="text-4xl">Link nicht mehr gültig</h1>
        <p className="mt-3">
          Dieser Bestätigungslink ist abgelaufen oder wurde schon benutzt. Unbestätigte Alarme löschen wir nach 48 Stunden.
          Leg den Alarm einfach auf der Produktseite neu an.
        </p>
        <p className="mt-4">
          <Link href="/" className="underline">
            Zur Startseite
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-xl">
      <h1 className="text-4xl">Preis-Alarm bestätigen</h1>
      <dl className="mt-4 grid gap-2 border-y border-ink py-4">
        <div>
          <dt className="text-sm text-ink-soft">Produkt</dt>
          <dd className="font-semibold">{a.productName}</dd>
        </div>
        <div>
          <dt className="text-sm text-ink-soft">Bedingung</dt>
          <dd>{describeCondition(a)}</dd>
        </div>
      </dl>
      <form action={confirmAlertAction} className="mt-6">
        <input type="hidden" name="token" value={token} />
        <button type="submit" className="rounded-sm bg-ink px-4 py-2 font-semibold text-paper hover:bg-terracotta">
          Ja, Alarm aktivieren
        </button>
      </form>
      <p className="mt-4 text-sm text-ink-soft">Wenn du das nicht warst: einfach nichts tun. Ohne Bestätigung löschen wir alles nach 48 Stunden.</p>
    </div>
  );
}
