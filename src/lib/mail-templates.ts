/**
 * Mail texts in napfdeal tone: short, concrete, "du". Plain HTML with inline styles
 * (mail clients ignore stylesheets), no images, no tracking pixels, no external resources.
 * Pure module.
 */

export type Link = { label: string; url: string };

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/** Builds text + HTML from paragraphs, one main button and footer links. */
export function layout(opts: {
  heading: string;
  paragraphs: string[];
  button?: Link;
  footerLinks?: Link[];
  footerNote?: string;
}): { text: string; html: string } {
  const text = [
    opts.heading,
    "",
    ...opts.paragraphs.flatMap((p) => [p, ""]),
    ...(opts.button ? [`${opts.button.label}: ${opts.button.url}`, ""] : []),
    "--",
    ...(opts.footerLinks ?? []).map((l) => `${l.label}: ${l.url}`),
    ...(opts.footerNote ? ["", opts.footerNote] : []),
    "",
    "napfdeal.com · Preisvergleich für Haustierbedarf",
  ].join("\n");

  const html = `<!doctype html><html lang="de"><body style="margin:0;padding:0;background:#f7f1e6;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f7f1e6;"><tr><td align="center" style="padding:24px 12px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;font-family:Georgia,'Times New Roman',serif;color:#1f1a17;">
<tr><td style="font-size:22px;font-weight:bold;padding-bottom:4px;">napf<span style="color:#a9492a;font-style:italic;">deal</span></td></tr>
<tr><td style="border-top:2px solid #1f1a17;padding-top:16px;font-size:22px;">${esc(opts.heading)}</td></tr>
${opts.paragraphs.map((p) => `<tr><td style="font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:1.5;padding-top:12px;">${esc(p)}</td></tr>`).join("\n")}
${
  opts.button
    ? `<tr><td style="padding-top:20px;"><a href="${esc(opts.button.url)}" style="display:inline-block;background:#1f1a17;color:#f7f1e6;text-decoration:none;font-family:Arial,Helvetica,sans-serif;font-weight:bold;font-size:16px;padding:12px 18px;border-radius:2px;">${esc(opts.button.label)}</a></td></tr>
<tr><td style="font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#5a4f47;padding-top:8px;word-break:break-all;">Falls der Knopf nicht geht: ${esc(opts.button.url)}</td></tr>`
    : ""
}
<tr><td style="border-top:1.5px dashed #cdbea4;margin-top:24px;padding-top:12px;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#5a4f47;">
${(opts.footerLinks ?? []).map((l) => `<a href="${esc(l.url)}" style="color:#5a4f47;">${esc(l.label)}</a>`).join(" &nbsp;·&nbsp; ")}
${opts.footerNote ? `<p style="margin:8px 0 0;">${esc(opts.footerNote)}</p>` : ""}
<p style="margin:8px 0 0;">napfdeal.com · Preisvergleich für Haustierbedarf</p>
</td></tr>
</table></td></tr></table></body></html>`;

  return { text, html };
}

export function verifyEmailMail(url: string) {
  return {
    subject: "Bitte bestätige deine E-Mail-Adresse",
    ...layout({
      heading: "Fast fertig",
      paragraphs: [
        "Du hast bei napfdeal ein Konto angelegt. Bestätige bitte noch deine E-Mail-Adresse, dann kannst du dich anmelden.",
        "Der Link gilt 24 Stunden. Wenn du dich nicht registriert hast, ignorier diese Mail einfach, dann passiert nichts.",
      ],
      button: { label: "E-Mail-Adresse bestätigen", url },
    }),
  };
}

export function resetPasswordMail(url: string) {
  return {
    subject: "Neues Passwort für napfdeal",
    ...layout({
      heading: "Passwort zurücksetzen",
      paragraphs: [
        "Jemand, hoffentlich du, möchte das Passwort für dein napfdeal-Konto ändern.",
        "Der Link gilt eine Stunde. Wenn du das nicht warst, ignorier diese Mail. Dein Passwort bleibt dann, wie es ist.",
      ],
      button: { label: "Neues Passwort festlegen", url },
    }),
  };
}

export function confirmAlertMail(opts: {
  productName: string;
  conditionText: string;
  confirmUrl: string;
  manageUrl: string;
  deleteDataUrl: string;
}) {
  return {
    subject: `Preis-Alarm bestätigen: ${opts.productName}`,
    ...layout({
      heading: "Bitte bestätige deinen Preis-Alarm",
      paragraphs: [
        `Produkt: ${opts.productName}`,
        `Bedingung: ${opts.conditionText}`,
        "Erst wenn du bestätigst, schicken wir dir Nachrichten. Ohne Bestätigung löschen wir den Alarm und deine Adresse nach 48 Stunden automatisch.",
      ],
      button: { label: "Alarm bestätigen", url: opts.confirmUrl },
      footerLinks: [
        { label: "Alle meine Alarme verwalten", url: opts.manageUrl },
        { label: "Alle meine Daten löschen", url: opts.deleteDataUrl },
      ],
      footerNote: "Du bekommst diese Mail, weil auf napfdeal.com ein Preis-Alarm für diese Adresse angelegt wurde.",
    }),
  };
}
