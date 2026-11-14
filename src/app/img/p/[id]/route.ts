import { createHash } from "node:crypto";
import { lookup } from "node:dns/promises";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { isIP } from "node:net";
import path from "node:path";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { product } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

/**
 * Product images are fetched by our server and served from napfdeal.com, so visitors' browsers
 * never contact shop CDNs (privacy, CSP 'self'). Only URLs stored from feeds are fetched – no open proxy.
 * Cache: container-local temp dir (rebuilt after a deploy, that's fine).
 */
const CACHE_DIR = process.env.IMAGE_CACHE_DIR ?? "/tmp/napfdeal-img";
const MAX_BYTES = 5 * 1024 * 1024;
const TIMEOUT_MS = 8000;
const TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
};
const CACHE_HEADERS = { "Cache-Control": "public, max-age=604800, stale-while-revalidate=86400", "X-Content-Type-Options": "nosniff" };

function isPrivateAddress(ip: string): boolean {
  if (isIP(ip) === 4) {
    const [a = 0, b = 0] = ip.split(".").map(Number);
    return a === 10 || a === 127 || a === 0 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127);
  }
  const v6 = ip.toLowerCase();
  return v6 === "::1" || v6 === "::" || v6.startsWith("fc") || v6.startsWith("fd") || v6.startsWith("fe80") || v6.startsWith("::ffff:");
}

async function isSafeUrl(raw: string): Promise<URL | null> {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return null;
  if (url.username || url.password) return null;
  const host = url.hostname;
  if (isIP(host) || host === "localhost" || !host.includes(".")) return null;
  try {
    const addrs = await lookup(host, { all: true });
    if (addrs.length === 0 || addrs.some((a) => isPrivateAddress(a.address))) return null;
  } catch {
    return null;
  }
  return url;
}

function notFound() {
  return new Response("Nicht gefunden", { status: 404, headers: { "Cache-Control": "public, max-age=3600" } });
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: raw } = await params;
  const id = Number.parseInt(raw, 10);
  if (!Number.isSafeInteger(id) || id <= 0) return notFound();

  const rows = await getDb().select({ imageUrl: product.imageUrl }).from(product).where(eq(product.id, id)).limit(1);
  const src = rows[0]?.imageUrl;
  if (!src) return notFound();

  const key = `${id}-${createHash("sha256").update(src).digest("hex").slice(0, 16)}`;
  for (const [type, ext] of Object.entries(TYPES)) {
    try {
      const data = await readFile(path.join(CACHE_DIR, `${key}.${ext}`));
      return new Response(new Uint8Array(data), { headers: { ...CACHE_HEADERS, "Content-Type": type } });
    } catch {
      // not cached in this format
    }
  }

  const url = await isSafeUrl(src);
  if (!url) return notFound();

  let res: Response;
  try {
    // redirect: "manual" – a redirect could point to an internal address after our check.
    res = await fetch(url, { redirect: "manual", signal: AbortSignal.timeout(TIMEOUT_MS), headers: { Accept: "image/*" } });
  } catch {
    return notFound();
  }
  const type = (res.headers.get("content-type") ?? "").split(";")[0]?.trim().toLowerCase() ?? "";
  const ext = TYPES[type];
  if (!res.ok || !ext) return notFound();
  const declared = Number(res.headers.get("content-length") ?? "0");
  if (declared > MAX_BYTES) return notFound();

  const buf = new Uint8Array(await res.arrayBuffer());
  if (buf.byteLength === 0 || buf.byteLength > MAX_BYTES) return notFound();

  try {
    await mkdir(CACHE_DIR, { recursive: true });
    await writeFile(path.join(CACHE_DIR, `${key}.${ext}`), buf);
  } catch {
    // Cache is best effort.
  }
  return new Response(buf, { headers: { ...CACHE_HEADERS, "Content-Type": type } });
}
