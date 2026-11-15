"use server";

import { and, count, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { isCountry } from "@/lib/countries";
import { getDb } from "@/lib/db";
import { product, user, watchlist, watchlistItem } from "@/lib/db/schema";

const MAX_LISTS = 20;
const MAX_ITEMS = 500;

async function requireUser(next = "/konto/") {
  const u = await getSessionUser();
  if (!u) redirect(`/anmelden/?next=${encodeURIComponent(next)}`);
  return u;
}

/** Only same-site paths are accepted as return targets. */
function safeBack(v: FormDataEntryValue | null, fallback: string): string {
  const s = typeof v === "string" ? v : "";
  return s.startsWith("/") && !s.startsWith("//") ? s : fallback;
}

function cleanName(v: FormDataEntryValue | null): string {
  return String(v ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 60);
}

async function ownList(userId: string, listId: number) {
  const rows = await getDb()
    .select({ id: watchlist.id })
    .from(watchlist)
    .where(and(eq(watchlist.id, listId), eq(watchlist.userId, userId)))
    .limit(1);
  return rows[0] ?? null;
}

export async function setCountryAction(fd: FormData): Promise<void> {
  const u = await requireUser();
  const c = fd.get("country");
  if (isCountry(c)) await getDb().update(user).set({ country: c, updatedAt: new Date() }).where(eq(user.id, u.id));
  redirect("/konto/#land");
}

export async function createListAction(fd: FormData): Promise<void> {
  const u = await requireUser();
  const name = cleanName(fd.get("name")) || "Meine Merkliste";
  const db = getDb();
  const [{ n } = { n: 0 }] = await db.select({ n: count() }).from(watchlist).where(eq(watchlist.userId, u.id));
  if (n < MAX_LISTS) await db.insert(watchlist).values({ userId: u.id, name });
  redirect("/konto/#merklisten");
}

export async function renameListAction(fd: FormData): Promise<void> {
  const u = await requireUser();
  const listId = Number(fd.get("listId"));
  const name = cleanName(fd.get("name"));
  if (name && (await ownList(u.id, listId))) {
    await getDb().update(watchlist).set({ name }).where(eq(watchlist.id, listId));
  }
  redirect(safeBack(fd.get("back"), "/konto/#merklisten"));
}

export async function deleteListAction(fd: FormData): Promise<void> {
  const u = await requireUser();
  const listId = Number(fd.get("listId"));
  if (await ownList(u.id, listId)) await getDb().delete(watchlist).where(eq(watchlist.id, listId));
  redirect("/konto/#merklisten");
}

/** "Merken" on a product page. listId "new" creates a list first. */
export async function addToListAction(fd: FormData): Promise<void> {
  const back = safeBack(fd.get("back"), "/konto/");
  const u = await requireUser(back);
  const db = getDb();
  const productId = Number(fd.get("productId"));
  const exists = await db.select({ id: product.id }).from(product).where(eq(product.id, productId)).limit(1);
  if (!exists[0]) redirect(back);

  let listId = Number(fd.get("listId"));
  if (fd.get("listId") === "new" || !Number.isSafeInteger(listId) || !(await ownList(u.id, listId))) {
    const lists = await db.select({ id: watchlist.id }).from(watchlist).where(eq(watchlist.userId, u.id)).limit(1);
    if (fd.get("listId") !== "new" && lists[0]) {
      listId = lists[0].id;
    } else {
      const [{ n } = { n: 0 }] = await db.select({ n: count() }).from(watchlist).where(eq(watchlist.userId, u.id));
      if (n >= MAX_LISTS) redirect(back);
      const created = await db
        .insert(watchlist)
        .values({ userId: u.id, name: cleanName(fd.get("newName")) || "Meine Merkliste" })
        .returning({ id: watchlist.id });
      listId = created[0]!.id;
    }
  }

  const [{ n } = { n: 0 }] = await db.select({ n: count() }).from(watchlistItem).where(eq(watchlistItem.watchlistId, listId));
  if (n < MAX_ITEMS) {
    await db.insert(watchlistItem).values({ watchlistId: listId, productId }).onConflictDoNothing();
  }
  redirect(`${back.split("?")[0]}?gemerkt=${listId}`);
}

export async function removeFromListAction(fd: FormData): Promise<void> {
  const u = await requireUser();
  const listId = Number(fd.get("listId"));
  const productId = Number(fd.get("productId"));
  if (await ownList(u.id, listId)) {
    await getDb()
      .delete(watchlistItem)
      .where(and(eq(watchlistItem.watchlistId, listId), eq(watchlistItem.productId, productId)));
  }
  redirect(`/konto/merkliste/${listId}/`);
}
