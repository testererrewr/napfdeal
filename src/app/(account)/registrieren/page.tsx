import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { RegisterForm, SocialButtons } from "@/components/account/AuthForms";
import { socialLoginsEnabled } from "@/lib/auth";
import { getSessionUser } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Konto anlegen" };
export const dynamic = "force-dynamic";

export default async function RegisterPage() {
  if (await getSessionUser()) redirect("/konto/");
  const social = socialLoginsEnabled();
  return (
    <div className="max-w-md">
      <h1 className="text-4xl">Konto anlegen</h1>
      <p className="mt-2 text-ink-soft">Kostenlos. Für Merklisten und alle Preis-Alarme an einem Ort.</p>
      <div className="mt-6 grid gap-6">
        <SocialButtons google={social.google} discord={social.discord} />
        {social.google || social.discord ? <p className="kicker text-ink-soft">oder mit E-Mail</p> : null}
        <RegisterForm />
      </div>
      <p className="mt-8 text-sm">
        Schon ein Konto?{" "}
        <Link href="/anmelden/" className="underline">
          Anmelden
        </Link>
      </p>
    </div>
  );
}
