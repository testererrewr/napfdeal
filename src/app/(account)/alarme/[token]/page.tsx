import type { Metadata } from "next";
import Link from "next/link";
import { eq } from "drizzle-orm";
import { guestAlertCommandAction } from "@/app/actions/alerts";
import { AlertList } from "@/components/account/AlertList";
import { getGuestAlerts } from "@/lib/account-queries";
import { getDb } from "@/lib/db";
import { guest } from "@/lib/db/schema";
import { issueToken, readToken } from "@/lib/tokens";

export const metadata: Metadata = { title: "Deine Preis-Alarme" };
export const dynamic = "force-dynamic";

/** Guests: manage all alerts of one address via the link from any mail (no login). */
export default async function GuestAlertsPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ bestaetigt?: string }>;
}) {
  const { token } = await params;
  const { bestaetigt } = await searchParams;
  const t = await readToken(token, "guest_manage");

  if (!t || !t.guestId) {
    return (
      <div className="max-w-xl">
        <h1 className="text-4xl">Link nicht mehr gültig</h1>
        <p className="mt-3">Dieser Verwaltungslink ist abgelaufen. In jeder neuen Mail von uns steckt ein frischer Link.</p>
        <p className="mt-4">
          <Link href="/" className="underline">
            Zur Startseite
          </Link>
        </p>
      </div>
    );
  }

  const [g] = await getDb().select({ email: guest.email }).from(guest).where(eq(guest.id, t.guestId)).limit(1);
  const alerts = await getGuestAlerts(t.guestId);
  const deleteToken = await issueToken("data_delete", { guestId: t.guestId });

  return (
    <div className="max-w-3xl">
      <h1 className="text-4xl">Deine Preis-Alarme</h1>
      <p className="mt-1 text-ink-soft">für {g?.email}</p>
      {bestaetigt ? (
        <p role="status" className="mt-4 border-l-[3px] border-moss bg-moss-soft px-3 py-2">
          Danke, dein Alarm ist aktiv. Diese Seite kannst du dir als Lesezeichen speichern.
        </p>
      ) : null}
      <div className="mt-6">
        <AlertList alerts={alerts} action={guestAlertCommandAction} token={token} />
      </div>
      <div className="mt-10 border-t border-dashed border-line pt-4 text-sm">
        <p>
          Mit einem Konto siehst du alle Alarme und Merklisten an einem Ort.{" "}
          <Link href="/registrieren/" className="underline">
            Konto anlegen
          </Link>
        </p>
        <p className="mt-2">
          <Link href={`/daten-loeschen/${deleteToken}/`} className="text-alarm underline">
            Alle meine Daten löschen
          </Link>
        </p>
      </div>
    </div>
  );
}
