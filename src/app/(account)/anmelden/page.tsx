import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { LoginForm, SocialButtons } from "@/components/account/AuthForms";
import { socialLoginsEnabled } from "@/lib/auth";
import { getSessionUser } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Anmelden" };
export const dynamic = "force-dynamic";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  const safeNext = next && next.startsWith("/") && !next.startsWith("//") ? next : "/konto/";
  if (await getSessionUser()) redirect(safeNext);
  const social = socialLoginsEnabled();

  return (
    <div className="grid gap-10 md:grid-cols-12">
      <div className="md:col-span-5">
        <h1 className="text-4xl">Anmelden</h1>
        <p className="mt-2 text-ink-soft">Mit Konto kannst du Merklisten anlegen und alle Preis-Alarme an einem Ort verwalten.</p>
        <div className="mt-6 grid gap-6">
          <SocialButtons google={social.google} discord={social.discord} next={safeNext} />
          {social.google || social.discord ? <p className="kicker text-ink-soft">oder mit E-Mail</p> : null}
          <LoginForm next={safeNext} />
        </div>
        <p className="mt-8 text-sm">
          Noch kein Konto?{" "}
          <Link href="/registrieren/" className="underline">
            Konto anlegen
          </Link>
        </p>
      </div>
      <aside className="text-sm text-ink-soft md:col-span-4 md:col-start-8">
        <p>Einen Preis-Alarm kannst du auch ohne Konto anlegen: direkt auf der Produktseite, nur mit deiner E-Mail-Adresse.</p>
      </aside>
    </div>
  );
}
