import { eq, sql } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { category, clickStat, offer, product } from "@/lib/db/schema";
import { isCountry } from "@/lib/countries";
import { todayKey } from "@/lib/format";
import { SITE_URL } from "@/lib/site";
import { productPath } from "@/lib/urls";

export const dynamic = "force-dynamic";

/** Allowed values for utm_source; anything else counts as "web". */
const SOURCES = new Set(["web", "mail", "discord", "push", "pinterest", "telegram", "instagram", "tiktok", "whatsapp"]);

const NO_STORE = { "Cache-Control": "no-store", "X-Robots-Tag": "noindex, nofollow" };

/**
 * All shop links go through here: /go/<offerId>/ → affiliate deeplink.
 * Counts the click per day, offer, country and source. No IP address, no user id, no cookie.
 */
export async function GET(req: Request, { params }: { params: Promise<{ offerId: string }> }) {
  const { offerId: raw } = await params;
  const offerId = Number.parseInt(raw, 10);
  if (!Number.isSafeInteger(offerId) || offerId <= 0 || String(offerId) !== raw) {
    return new Response("Nicht gefunden", { status: 404, headers: NO_STORE });
  }

  const db = getDb();
  const rows = await db
    .select({
      deeplink: offer.deeplink,
      active: offer.active,
      country: offer.country,
      slug: product.slug,
      categoryPath: category.path,
    })
    .from(offer)
    .leftJoin(product, eq(product.id, offer.productId))
    .leftJoin(category, eq(category.id, product.categoryId))
    .where(eq(offer.id, offerId))
    .limit(1);
  const o = rows[0];

  if (!o) return new Response("Nicht gefunden", { status: 404, headers: NO_STORE });

  // Offer gone from the shop's feed: back to the product page instead of a dead shop link.
  if (!o.active || !/^https:\/\//.test(o.deeplink)) {
    const target = o.slug && isCountry(o.country) ? `${SITE_URL}${productPath(o.country, o.categoryPath, o.slug)}` : `${SITE_URL}/`;
    return new Response(null, { status: 302, headers: { ...NO_STORE, Location: target } });
  }

  const src = new URL(req.url).searchParams.get("utm_source")?.toLowerCase() ?? "web";
  const source = SOURCES.has(src) ? src : "web";

  try {
    await db
      .insert(clickStat)
      .values({ day: todayKey(), offerId, country: o.country, source, clicks: 1 })
      .onConflictDoUpdate({
        target: [clickStat.day, clickStat.offerId, clickStat.source],
        set: { clicks: sql`${clickStat.clicks} + 1` },
      });
  } catch {
    // Counting must never block the redirect.
  }

  // Referrer stays at the site default (origin only): some networks check the publisher domain.
  return new Response(null, { status: 302, headers: { ...NO_STORE, Location: o.deeplink } });
}
