"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { createAlertAction, type AlertFormState } from "@/app/actions/alerts";

const input = "mt-1 block w-full rounded-sm border border-ink/40 bg-white px-3 py-2 focus:border-ink focus:outline-none";

export function AlertForm({
  productId,
  country,
  suggestedTarget,
  loggedIn,
}: {
  productId: number;
  country: "de" | "at";
  suggestedTarget: string;
  loggedIn: boolean;
}) {
  const [state, action, pending] = useActionState<AlertFormState, FormData>(createAlertAction, { status: "idle" });
  const [kind, setKind] = useState<"target" | "drop">("target");

  if (state.status === "ok") {
    return (
      <p role="status" className="border-l-[3px] border-moss bg-moss-soft px-3 py-2 text-sm">
        {state.message}
      </p>
    );
  }

  return (
    <form action={action} className="grid gap-4 text-[0.95rem]">
      <input type="hidden" name="productId" value={productId} />
      <input type="hidden" name="country" value={country} />
      {/* Honeypot for bots: invisible to people and screen readers */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label>
          Website
          <input type="text" name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <fieldset className="grid gap-2">
        <legend className="text-sm font-semibold">Wann willst du Bescheid bekommen?</legend>
        <label className="flex items-center gap-2">
          <input type="radio" name="kind" value="target" checked={kind === "target"} onChange={() => setKind("target")} />
          Sobald der Preis bei meinem Wunschpreis oder darunter liegt
        </label>
        {kind === "target" ? (
          <label className="ml-6 block max-w-[12rem]">
            <span className="text-sm">Wunschpreis in €</span>
            <input className={input} name="target" inputMode="decimal" defaultValue={suggestedTarget} required />
          </label>
        ) : null}
        <label className="flex items-center gap-2">
          <input type="radio" name="kind" value="drop" checked={kind === "drop"} onChange={() => setKind("drop")} />
          Bei jeder Preissenkung
        </label>
        {kind === "drop" ? (
          <div className="ml-6 flex flex-wrap gap-3">
            <label className="block w-28">
              <span className="text-sm">ab … %</span>
              <input className={input} name="minDropPercent" inputMode="decimal" defaultValue="3" />
            </label>
            <label className="block w-28">
              <span className="text-sm">oder ab … €</span>
              <input className={input} name="minDropEuro" inputMode="decimal" defaultValue="0,50" />
            </label>
          </div>
        ) : null}
      </fieldset>

      <fieldset className="grid gap-2">
        <legend className="sr-only">Optionen</legend>
        <label className="flex items-center gap-2">
          <input type="hidden" name="includeShippingField" value="1" />
          <input type="checkbox" name="includeShipping" value="1" defaultChecked />
          Versandkosten mitrechnen
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" name="backInStock" value="1" />
          Auch melden, wenn es wieder lieferbar ist
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" name="digest" value="1" />
          Lieber eine Tageszusammenfassung statt einzelner Mails
        </label>
      </fieldset>

      {loggedIn ? (
        <p className="text-sm text-ink-soft">Wir schicken die Nachricht an die E-Mail-Adresse deines Kontos.</p>
      ) : (
        <div className="grid gap-2">
          <label className="block max-w-sm">
            <span className="text-sm font-semibold">Deine E-Mail-Adresse</span>
            <input className={input} type="email" name="email" autoComplete="email" required />
          </label>
          <label className="flex items-start gap-2 text-sm">
            <input type="checkbox" name="consent" value="1" className="mt-1" required />
            <span>
              Ja, schickt mir für diesen Alarm E-Mails. Ich bekomme zuerst eine Mail zum Bestätigen und kann jeden Alarm mit
              einem Klick löschen. Details in der{" "}
              <Link href="/datenschutz/" className="underline">
                Datenschutzerklärung
              </Link>
              .
            </span>
          </label>
        </div>
      )}

      <div>
        <button type="submit" disabled={pending} className="rounded-sm bg-ink px-4 py-2 font-semibold text-paper hover:bg-terracotta disabled:opacity-60">
          {pending ? "Einen Moment …" : "Preis-Alarm anlegen"}
        </button>
      </div>
      {state.status === "error" ? (
        <p role="alert" className="border-l-[3px] border-alarm bg-terracotta-soft px-3 py-2 text-sm">
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
