import nodemailer, { type Transporter } from "nodemailer";

/**
 * Transactional mail via SMTP (provider exchangeable via .env; Brevo by default).
 * If SMTP isn't configured, sending fails with a clear error. MAIL_DEV_LOG=1 prints mails to the
 * log instead – only for local development, never in production (it would log addresses).
 */
let transporter: Transporter | null = null;

export function mailConfigured(): boolean {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD);
}

function getTransporter(): Transporter {
  if (!transporter) {
    const port = Number(process.env.SMTP_PORT ?? 587);
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure: port === 465,
      requireTLS: port !== 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD },
    });
  }
  return transporter;
}

export type Mail = { to: string; subject: string; text: string; html: string; headers?: Record<string, string> };

export async function sendMail(mail: Mail): Promise<void> {
  if (!mailConfigured()) {
    if (process.env.MAIL_DEV_LOG === "1") {
      console.log(`[mail:dev] to=${mail.to} subject=${mail.subject}\n${mail.text}`);
      return;
    }
    throw new Error("E-Mail-Versand ist noch nicht eingerichtet (SMTP fehlt).");
  }
  await getTransporter().sendMail({
    from: process.env.MAIL_FROM ?? "napfdeal <hallo@napfdeal.com>",
    to: mail.to,
    subject: mail.subject,
    text: mail.text,
    html: mail.html,
    headers: mail.headers,
  });
}
