import type { Metadata } from "next";
import Link from "next/link";
import { eq } from "drizzle-orm";
import { deleteGuestDataAction } from "@/app/actions/alerts";
import { getDb } from "@/lib/db";
import { guest } from "@/lib/db/schema";
import { readToken } from "@/lib/tokens";

export const metadata: Metadata = { title: "Alle meine Daten löschen" };
export const dynamic = "force-dynamic";

export default async function DeleteGuestDataPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const t = await readToken(token, "data_delete");
  const [g] = t?.guestId ? await getDb().select({ email: guest.email }).from(guest).where(eq(guest.id, t.guestId)).limit(1) : [];

  if (!t || !g) {
    return (
      <div className="max-w-xl">
        <h1 className="text-4xl">Nichts zu löschen</h1>
        <p className="mt-3">Dieser Link ist abgelaufen, oder die Daten sind schon gelöscht.</p>
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
      <h1 className="text-4xl">Alle meine Daten löschen</h1>
      <p className="mt-3">
        Wir löschen sofort die Adresse <strong>{g.email}</strong>, alle Preis-Alarme dazu und alle Links aus unseren Mails.
        Das lässt sich nicht rückgängig machen.
      </p>
      <form action={deleteGuestDataAction} className="mt-6">
        <input type="hidden" name="token" value={token} />
        <button type="submit" className="rounded-sm bg-alarm px-4 py-2 font-semibold text-paper hover:opacity-90">
          Ja, alles löschen
        </button>
      </form>
    </div>
  );
}
