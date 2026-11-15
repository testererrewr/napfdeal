import { getAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * The site uses trailing slashes (next.config trailingSlash), Better Auth's routes don't.
 * Next redirects /api/auth/x → /api/auth/x/ (308, method and body kept); strip it again here.
 */
async function handle(req: Request): Promise<Response> {
  const url = new URL(req.url);
  if (url.pathname.length > 1 && url.pathname.endsWith("/")) {
    url.pathname = url.pathname.replace(/\/+$/, "");
    const init: RequestInit & { duplex?: "half" } = {
      method: req.method,
      headers: req.headers,
      body: req.method === "GET" || req.method === "HEAD" ? undefined : await req.arrayBuffer(),
    };
    return getAuth().handler(new Request(url, init));
  }
  return getAuth().handler(req);
}

export const GET = handle;
export const POST = handle;
