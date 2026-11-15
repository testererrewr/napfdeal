import type { Metadata } from "next";
import { ForgotPasswordForm } from "@/components/account/AuthForms";

export const metadata: Metadata = { title: "Passwort vergessen" };

export default function ForgotPasswordPage() {
  return (
    <div className="max-w-md">
      <h1 className="text-4xl">Passwort vergessen</h1>
      <p className="mt-2 text-ink-soft">Gib deine E-Mail-Adresse ein. Wir schicken dir einen Link, mit dem du ein neues Passwort festlegst.</p>
      <div className="mt-6">
        <ForgotPasswordForm />
      </div>
    </div>
  );
}
