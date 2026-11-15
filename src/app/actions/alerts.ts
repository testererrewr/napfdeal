"use server";

import { and, count, eq, inArray, type SQL } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { describeCondition, isPlausibleEmail, parseAlertInput } from "@/lib/alert-rules";
import { getSessionUser } from "@/lib/auth/session";
import { getDb } from "@/lib/db";
import { accessToken, alert, guest, product } from "@/lib/db/schema";
import { sendMail } from "@/lib/mail";
import { confirmAlertMail } from "@/lib/mail-templates";
import { isPreview } from "@/lib/preview";
import { clientIp, RateLimiter } from "@/lib/rate-limit";
import { SITE_URL } from "@/lib/site";
import { issueToken, markTokenUsed, readToken } from "@/lib/tokens";

export type AlertFormState = { status: "idle" | "ok" | "error"; message?: string };

// In-memory only (see Datenschutz): per IP and per address.
const perIp = new RateLimiter(6, 60 * 60 * 1000);
const perEmail = new RateLimiter(10, 24 * 60 * 60 * 1000);

const MAX_ALERTS_PER_USER = 200;
const MAX_ALERTS_PER_GUEST = 50;

export async function createAlertAction(_prev: AlertFormState, fd: FormData): Promise<AlertFormState> {
  const get = (k: string) => {
    const v = fd.get(k);
    return typeof v === "string" ? v : null;
  };

  // Honeypot: real people never fill this hidden field.
  if (get("website")) return { status: "ok", message: "Danke! Schau in dein Postfach." };

  const parsed = parseAlertInput(get);
  if (!parsed.ok) return { status: "error", message: parsed.error };
  const input = parsed.value;
  const db = getDb();

  const prod = await db
    .select({ id: product.id, name: product.name, isTest: product.isTest })
    .from(product)
    .where(eq(product.id, input.productId))
    .limit(1);
  const p = prod[0];
  if (!p || (p.isTest && !(await isPreview()))) return { status: "error", message: "Dieses Produkt gibt es nicht (mehr)." };

  const h = await headers();
  if (!perIp.hit(clientIp(h))) {
    return { status: "error", message: "Zu viele Alarme in kurzer Zeit. Bitte versuch es in einer Stunde noch einmal." };
  }

  const values = {
    productId: input.productId,
    country: input.country,
    kind: input.kind,
    targetCents: input.targetCents,
    includeShipping: input.includeShipping,
    minDropPercent: input.minDropPercent,
    minDropCents: input.minDropCents,
    backInStock: input.backInStock,
    digest: input.digest,
    channels: ["email"],
  };

  // Logged in (always with a verified address): active right away.
  const sessionUser = await getSessionUser();
  if (sessionUser) {
    const [{ n } = { n: 0 }] = await db.select({ n: count() }).from(alert).where(eq(alert.userId, sessionUser.id));
    if (n >= MAX_ALERTS_PER_USER) return { status: "error", message: `Du hast schon ${MAX_ALERTS_PER_USER} Alarme. Lösch bitte erst ein paar alte.` };
    await db.insert(alert).values({ ...values, userId: sessionUser.id, status: "active", confirmedAt: new Date() });
    return { status: "ok", message: "Alarm ist aktiv. Du findest ihn in deinem Konto unter „Preis-Alarme“." };
  }

  // Guest: double opt-in for every single alert.
  if (get("consent") !== "1") return { status: "error", message: "Bitte bestätige, dass wir dir dafür E-Mails schicken dürfen." };
  const email = (get("email") ?? "").trim().toLowerCase();
  if (!isPlausibleEmail(email)) return { status: "error", message: "Bitte gib eine gültige E-Mail-Adresse an." };
  if (!perEmail.hit(email)) return { status: "error", message: "Für diese Adresse wurden heute schon viele Alarme angelegt. Bitte morgen wieder." };

  const g = await db
    .insert(guest)
    .values({ email })
    .onConflictDoUpdate({ target: guest.email, set: { lastActiveAt: new Date() } })
    .returning({ id: guest.id });
  const guestId = g[0]!.id;

  const [{ n } = { n: 0 }] = await db.select({ n: count() }).from(alert).where(eq(alert.guestId, guestId));
  if (n >= MAX_ALERTS_PER_GUEST) return { status: "error", message: "Für diese Adresse gibt es schon sehr viele Alarme." };

  const created = await db.insert(alert).values({ ...values, guestId, status: "pending" }).returning({ id: alert.id });
  const alertId = created[0]!.id;

  const confirm = await issueToken("alert_confirm", { guestId, alertId });
  const manage = await issueToken("guest_manage", { guestId });
  const del = await issueToken("data_delete", { guestId });

  try {
    await sendMail({
      to: email,
      ...confirmAlertMail({
        productName: p.name,
        conditionText: describeCondition(input),
        confirmUrl: `${SITE_URL}/alarm/bestaetigen/${confirm}/`,
        manageUrl: `${SITE_URL}/alarme/${manage}/`,
        deleteDataUrl: `${SITE_URL}/daten-loeschen/${del}/`,
      }),
    });
  } catch {
    await db.delete(alert).where(eq(alert.id, alertId));
    await db.delete(accessToken).where(and(eq(accessToken.guestId, guestId), inArray(accessToken.kind, ["alert_confirm"])));
    return { status: "error", message: "Wir konnten gerade keine Bestätigungsmail senden. Bitte versuch es später noch einmal." };
  }

  return {
    status: "ok",
    message: "Fast fertig: Wir haben dir eine Mail geschickt. Erst wenn du den Link darin anklickst, ist der Alarm aktiv.",
  };
}

/** Guest clicked "Alarm bestätigen" on the landing page (a button, so mail scanners can't confirm by prefetching). */
export async function confirmAlertAction(fd: FormData): Promise<void> {
  const token = String(fd.get("token") ?? "");
  const t = await readToken(token, "alert_confirm");
  if (!t || !t.alertId || !t.guestId) redirect("/alarm/bestaetigen/ungueltig/");
  const db = getDb();
  await db
    .update(alert)
    .set({ status: "active", confirmedAt: new Date() })
    .where(and(eq(alert.id, t.alertId), eq(alert.guestId, t.guestId)));
  await markTokenUsed(t.id);
  await db.update(guest).set({ lastActiveAt: new Date() }).where(eq(guest.id, t.guestId));
  const manage = await issueToken("guest_manage", { guestId: t.guestId });
  redirect(`/alarme/${manage}/?bestaetigt=1`);
}

type Command = "pause" | "resume" | "delete";

function commandFrom(fd: FormData): Command | null {
  const c = fd.get("command");
  return c === "pause" || c === "resume" || c === "delete" ? c : null;
}

async function applyCommand(where: SQL | undefined, command: Command) {
  // Never run an UPDATE/DELETE without a condition.
  if (!where) return;
  const db = getDb();
  if (command === "delete") await db.delete(alert).where(where);
  else await db.update(alert).set({ status: command === "pause" ? "paused" : "active" }).where(and(where, inArray(alert.status, ["active", "paused"])));
}

/** Guest management page (token link from any mail). */
export async function guestAlertCommandAction(fd: FormData): Promise<void> {
  const token = String(fd.get("token") ?? "");
  const t = await readToken(token, "guest_manage");
  if (!t || !t.guestId) redirect("/alarme/ungueltig/");
  const alertId = Number(fd.get("alertId"));
  const command = commandFrom(fd);
  if (command && Number.isSafeInteger(alertId)) {
    await applyCommand(and(eq(alert.id, alertId), eq(alert.guestId, t.guestId)), command);
  }
  redirect(`/alarme/${token}/`);
}

/** Logged-in users, from /konto. */
export async function userAlertCommandAction(fd: FormData): Promise<void> {
  const u = await getSessionUser();
  if (!u) redirect("/anmelden/?next=/konto/");
  const alertId = Number(fd.get("alertId"));
  const command = commandFrom(fd);
  if (command && Number.isSafeInteger(alertId)) {
    await applyCommand(and(eq(alert.id, alertId), eq(alert.userId, u.id)), command);
  }
  redirect("/konto/#alarme");
}

/** Guest: delete the address and everything attached to it (alerts, links). */
export async function deleteGuestDataAction(fd: FormData): Promise<void> {
  const token = String(fd.get("token") ?? "");
  const t = await readToken(token, "data_delete");
  if (!t || !t.guestId) redirect("/daten-loeschen/ungueltig/");
  // Cascades to alerts and access tokens of this guest.
  await getDb().delete(guest).where(eq(guest.id, t.guestId));
  // TODO(phase 5): remove the address at the mail provider (Brevo API) and write the anonymous deletion log.
  redirect("/daten-loeschen/erledigt/");
}
