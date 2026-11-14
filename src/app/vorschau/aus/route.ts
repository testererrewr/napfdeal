import { PREVIEW_COOKIE } from "@/lib/preview";
import { SITE_URL } from "@/lib/site";

export const dynamic = "force-dynamic";

/** Ends preview mode in this browser. */
export async function GET() {
  const headers = new Headers({ Location: `${SITE_URL}/de/`, "Cache-Control": "no-store" });
  headers.append("Set-Cookie", `${PREVIEW_COOKIE}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax`);
  return new Response(null, { status: 303, headers });
}
