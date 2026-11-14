import { timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

/**
 * Private preview for the operator: shows test data (FEEDS_TEST_MODE) on the real pages.
 * Enabled only if PREVIEW_TOKEN (≥ 24 chars) is set. Opening /vorschau/<token>/ sets a
 * cookie in the operator's browser; visitors never get it and never see test data.
 */
export const PREVIEW_COOKIE = "napfdeal_vorschau";

export function previewToken(): string | null {
  const t = process.env.PREVIEW_TOKEN ?? "";
  return t.length >= 24 ? t : null;
}

export function tokenMatches(candidate: string | undefined | null): boolean {
  const token = previewToken();
  if (!token || !candidate) return false;
  const a = Buffer.from(candidate);
  const b = Buffer.from(token);
  return a.length === b.length && timingSafeEqual(a, b);
}

/** True if the current request comes from the operator's preview browser. */
export async function isPreview(): Promise<boolean> {
  if (!previewToken()) return false;
  const jar = await cookies();
  return tokenMatches(jar.get(PREVIEW_COOKIE)?.value);
}
