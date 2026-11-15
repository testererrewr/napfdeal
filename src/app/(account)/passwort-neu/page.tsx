import type { Metadata } from "next";
import Link from "next/link";
import { ResetPasswordForm } from "@/components/account/AuthForms";

export const metadata: Metadata = { title: "Neues Passwort" };
export const dynamic = "force-dynamic";

export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ token?: string; error?: string }> }) {
  const { token, error } = await searchParams;
  return (
    <div className="max-w-md">
      <h1 className="text-4xl">Neues Passwort</h1>
      {token && !error ? (
        <div className="mt-6">
          <ResetPasswordForm token={token} />
        </div>
      ) : (
        <p className="mt-4">
          Dieser Link ist abgelaufen oder ungültig.{" "}
          <Link href="/passwort-vergessen/" className="underline">
            Neuen Link anfordern
          </Link>
        </p>
      )}
    </div>
  );
}
