import { sql } from "drizzle-orm";
import { getDb } from "@/lib/db";

/**
 * Retention rules (run hourly by the worker):
 *  - unconfirmed guest alerts: 48 h
 *  - guests without any alert: 48 h after their last activity
 *  - expired or used access tokens: 7 days after expiry
 *  - expired Better Auth verifications and sessions
 * Phase 5 adds: inactive accounts (24 months + 30 days notice), click stats aggregation.
 */
export async function runRetention(): Promise<Record<string, number>> {
  const db = getDb();
  const n = (r: unknown) => Array.from(r as unknown as unknown[]).length;

  const alerts = await db.execute(sql`
    delete from alert where status = 'pending' and created_at < now() - interval '48 hours' returning id
  `);
  const guests = await db.execute(sql`
    delete from guest g
    where g.last_active_at < now() - interval '48 hours'
      and not exists (select 1 from alert a where a.guest_id = g.id)
    returning id
  `);
  const tokens = await db.execute(sql`
    delete from access_token where expires_at < now() - interval '7 days' returning id
  `);
  const verifications = await db.execute(sql`delete from verification where expires_at < now() returning id`);
  const sessions = await db.execute(sql`delete from session where expires_at < now() returning id`);

  return {
    alerts: n(alerts),
    guests: n(guests),
    tokens: n(tokens),
    verifications: n(verifications),
    sessions: n(sessions),
  };
}
