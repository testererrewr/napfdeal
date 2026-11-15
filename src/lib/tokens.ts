import { createHash, randomBytes } from "node:crypto";
import { and, eq, gt } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { accessToken } from "@/lib/db/schema";

export type TokenKind = "alert_confirm" | "guest_manage" | "alert_delete" | "data_delete";

const HOUR = 60 * 60 * 1000;
export const TOKEN_TTL_MS: Record<TokenKind, number> = {
  alert_confirm: 48 * HOUR,
  guest_manage: 90 * 24 * HOUR,
  alert_delete: 90 * 24 * HOUR,
  data_delete: 90 * 24 * HOUR,
};

/** One-time kinds can be used once; the others work until they expire. */
const ONE_TIME: ReadonlySet<TokenKind> = new Set(["alert_confirm"]);

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function issueToken(kind: TokenKind, owner: { guestId?: number; userId?: string; alertId?: number }): Promise<string> {
  const token = randomBytes(32).toString("base64url");
  await getDb()
    .insert(accessToken)
    .values({
      hash: hashToken(token),
      kind,
      guestId: owner.guestId ?? null,
      userId: owner.userId ?? null,
      alertId: owner.alertId ?? null,
      expiresAt: new Date(Date.now() + TOKEN_TTL_MS[kind]),
    });
  return token;
}

export type TokenRow = typeof accessToken.$inferSelect;

/** Returns the token row if it exists, has the right kind, isn't expired and (for one-time kinds) wasn't used. */
export async function readToken(token: string | null | undefined, kind: TokenKind): Promise<TokenRow | null> {
  if (!token || token.length < 20 || token.length > 100) return null;
  const rows = await getDb()
    .select()
    .from(accessToken)
    .where(and(eq(accessToken.hash, hashToken(token)), eq(accessToken.kind, kind), gt(accessToken.expiresAt, new Date())))
    .limit(1);
  const row = rows[0];
  if (!row) return null;
  if (ONE_TIME.has(kind) && row.usedAt) return null;
  return row;
}

export async function markTokenUsed(id: number): Promise<void> {
  await getDb().update(accessToken).set({ usedAt: new Date() }).where(eq(accessToken.id, id));
}
