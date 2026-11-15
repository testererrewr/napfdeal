"use client";

import Link from "next/link";
import { useState } from "react";
import { authClient } from "@/lib/auth/client";

const input =
  "mt-1 block w-full rounded-sm border border-ink/40 bg-white px-3 py-2 text-base focus:border-ink focus:outline-none";
const button = "rounded-sm bg-ink px-4 py-2 font-semibold text-paper hover:bg-terracotta disabled:opacity-60";

function Notice({ kind, children }: { kind: "ok" | "error"; children: React.ReactNode }) {
  return (
    <p
      role={kind === "error" ? "alert" : "status"}
      className={`mt-4 border-l-[3px] px-3 py-2 text-sm ${kind === "error" ? "border-alarm bg-terracotta-soft" : "border-moss bg-moss-soft"}`}
    >
      {children}
    </p>
  );
}

/** Only same-site paths as redirect targets after login. */
function safeNext(next: string | undefined): string {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : "/konto/";
}

export function SocialButtons({ google, discord, next }: { google: boolean; discord: boolean; next?: string }) {
  const [busy, setBusy] = useState(false);
  if (!google && !discord) return null;
  const go = async (provider: "google" | "discord") => {
    setBusy(true);
    await authClient.signIn.social({ provider, callbackURL: safeNext(next) });
    setBusy(false);
  };
  return (
    <div className="grid gap-2">
      {google ? (
        <button type="button" disabled={busy} onClick={() => go("google")} className="rounded-sm border border-ink px-4 py-2 font-semibold hover:bg-paper-deep">
          Weiter mit Google
        </button>
      ) : null}
      {discord ? (
        <button type="button" disabled={busy} onClick={() => go("discord")} className="rounded-sm border border-ink px-4 py-2 font-semibold hover:bg-paper-deep">
          Weiter mit Discord
        </button>
      ) : null}
    </div>
  );
}

export function LoginForm({ next }: { next?: string }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unverified, setUnverified] = useState(false);
  const [resent, setResent] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setUnverified(false);
    const { error: err } = await authClient.signIn.email({ email, password, callbackURL: safeNext(next) });
    setBusy(false);
    if (err) {
      if (err.status === 403) {
        setUnverified(true);
        setError("Bitte bestätige zuerst deine E-Mail-Adresse. Den Link haben wir dir bei der Registrierung geschickt.");
      } else {
        setError("E-Mail-Adresse oder Passwort stimmen nicht.");
      }
      return;
    }
    window.location.href = safeNext(next);
  };

  const resend = async () => {
    await authClient.sendVerificationEmail({ email, callbackURL: "/konto/" });
    setResent(true);
  };

  return (
    <form onSubmit={submit} className="grid gap-4">
      <label className="block">
        <span className="text-sm font-semibold">E-Mail-Adresse</span>
        <input className={input} type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
      </label>
      <label className="block">
        <span className="text-sm font-semibold">Passwort</span>
        <input className={input} type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
      </label>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button type="submit" disabled={busy} className={button}>
          {busy ? "Einen Moment …" : "Anmelden"}
        </button>
        <Link href="/passwort-vergessen/" className="text-sm underline">
          Passwort vergessen?
        </Link>
      </div>
      {error ? <Notice kind="error">{error}</Notice> : null}
      {unverified && !resent ? (
        <button type="button" onClick={resend} className="justify-self-start text-sm underline">
          Bestätigungsmail noch einmal schicken
        </button>
      ) : null}
      {resent ? <Notice kind="ok">Wir haben dir die Bestätigungsmail noch einmal geschickt.</Notice> : null}
    </form>
  );
}

export function RegisterForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [adult, setAdult] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adult) {
      setError("Ein Konto ist erst ab 16 Jahren möglich.");
      return;
    }
    if (password.length < 10) {
      setError("Das Passwort muss mindestens 10 Zeichen lang sein.");
      return;
    }
    setBusy(true);
    setError(null);
    const { error: err } = await authClient.signUp.email({ email, password, name: "", callbackURL: "/konto/" });
    setBusy(false);
    if (err) {
      // Same message for existing addresses: doesn't reveal who has an account.
      setError(
        err.status === 422 || err.status === 400
          ? "Das hat nicht geklappt. Prüf bitte die Adresse. Hast du schon ein Konto? Dann melde dich an oder setz dein Passwort zurück."
          : "Das hat gerade nicht geklappt. Bitte versuch es gleich noch einmal.",
      );
      return;
    }
    setDone(true);
  };

  if (done) {
    return (
      <Notice kind="ok">
        Fast geschafft: Wir haben dir eine Mail an {email} geschickt. Klick auf den Link darin, dann ist dein Konto aktiv.
      </Notice>
    );
  }

  return (
    <form onSubmit={submit} className="grid gap-4">
      <label className="block">
        <span className="text-sm font-semibold">E-Mail-Adresse</span>
        <input className={input} type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
      </label>
      <label className="block">
        <span className="text-sm font-semibold">Passwort</span>
        <span className="block text-xs text-ink-soft">Mindestens 10 Zeichen. Ein Satz aus mehreren Wörtern ist sicher und leicht zu merken.</span>
        <input
          className={input}
          type="password"
          autoComplete="new-password"
          minLength={10}
          maxLength={128}
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </label>
      <label className="flex items-start gap-2 text-sm">
        <input type="checkbox" className="mt-1" checked={adult} onChange={(e) => setAdult(e.target.checked)} required />
        <span>Ich bin mindestens 16 Jahre alt.</span>
      </label>
      <p className="text-xs text-ink-soft">
        Wir speichern deine E-Mail-Adresse und dein Passwort (nur als Hash), sonst nichts. Details in der{" "}
        <Link href="/datenschutz/" className="underline">
          Datenschutzerklärung
        </Link>
        .
      </p>
      <button type="submit" disabled={busy} className={`${button} justify-self-start`}>
        {busy ? "Einen Moment …" : "Konto anlegen"}
      </button>
      {error ? <Notice kind="error">{error}</Notice> : null}
    </form>
  );
}

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    await authClient.requestPasswordReset({ email, redirectTo: "/passwort-neu/" });
    setBusy(false);
    setDone(true);
  };

  if (done) {
    return (
      <Notice kind="ok">
        Wenn es zu {email} ein Konto gibt, ist jetzt eine Mail mit einem Link unterwegs. Der Link gilt eine Stunde.
      </Notice>
    );
  }
  return (
    <form onSubmit={submit} className="grid gap-4">
      <label className="block">
        <span className="text-sm font-semibold">E-Mail-Adresse</span>
        <input className={input} type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
      </label>
      <button type="submit" disabled={busy} className={`${button} justify-self-start`}>
        Link schicken
      </button>
    </form>
  );
}

export function ResetPasswordForm({ token }: { token: string }) {
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [state, setState] = useState<"idle" | "done" | "error">("idle");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await authClient.resetPassword({ newPassword: password, token });
    setBusy(false);
    setState(error ? "error" : "done");
  };

  if (state === "done") {
    return (
      <Notice kind="ok">
        Dein Passwort ist geändert.{" "}
        <Link href="/anmelden/" className="underline">
          Jetzt anmelden
        </Link>
      </Notice>
    );
  }
  return (
    <form onSubmit={submit} className="grid gap-4">
      <label className="block">
        <span className="text-sm font-semibold">Neues Passwort</span>
        <span className="block text-xs text-ink-soft">Mindestens 10 Zeichen.</span>
        <input
          className={input}
          type="password"
          autoComplete="new-password"
          minLength={10}
          maxLength={128}
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </label>
      <button type="submit" disabled={busy} className={`${button} justify-self-start`}>
        Passwort speichern
      </button>
      {state === "error" ? (
        <Notice kind="error">
          Der Link ist abgelaufen oder wurde schon benutzt.{" "}
          <Link href="/passwort-vergessen/" className="underline">
            Neuen Link anfordern
          </Link>
        </Notice>
      ) : null}
    </form>
  );
}

export function SignOutButton() {
  return (
    <button
      type="button"
      onClick={async () => {
        await authClient.signOut();
        window.location.href = "/";
      }}
      className="rounded-sm border border-ink px-3 py-1.5 text-sm hover:bg-paper-deep"
    >
      Abmelden
    </button>
  );
}

export function LinkSocialButton({ provider, label }: { provider: "google" | "discord"; label: string }) {
  return (
    <button
      type="button"
      onClick={() => authClient.linkSocial({ provider, callbackURL: "/konto/" })}
      className="rounded-sm border border-ink px-3 py-1.5 text-sm hover:bg-paper-deep"
    >
      {label}
    </button>
  );
}
