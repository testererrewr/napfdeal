import { PREVIEW_COOKIE, tokenMatches } from "@/lib/preview";
import { SITE_URL } from "@/lib/site";

export const dynamic = "force-dynamic";

/** Operator-only: /vorschau/<PREVIEW_TOKEN>/ switches this browser into preview mode (test data visible). */
export async function GET(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!tokenMatches(token)) {
    return new Response("Nicht gefunden", { status: 404, headers: { "Cache-Control": "no-store" } });
  }
  const headers = new Headers({
    Location: `${SITE_URL}/de/`,
    "Cache-Control": "no-store",
    "Referrer-Policy": "no-referrer",
  });
  headers.append(
    "Set-Cookie",
    `${PREVIEW_COOKIE}=${encodeURIComponent(token)}; Path=/; Max-Age=${30 * 24 * 3600}; HttpOnly; Secure; SameSite=Lax`,
  );
  return new Response(null, { status: 303, headers });
}
