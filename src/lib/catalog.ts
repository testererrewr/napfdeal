import { getDb } from "@/lib/db";
import { category } from "@/lib/db/schema";
import { ANIMALS, SUBCATEGORIES } from "@/lib/categories";

/**
 * Inserts missing seed categories (animal + animal/subcategory). Never overwrites
 * names or order an admin has changed.
 */
export async function ensureSeedCategories(): Promise<void> {
  const db = getDb();
  let order = 0;
  for (const a of ANIMALS) {
    order += 10;
    await db
      .insert(category)
      .values({ path: a.slug, slug: a.slug, name: a.name, note: a.note ?? null, sortOrder: order })
      .onConflictDoNothing({ target: category.path });
  }

  const animals = await db.select({ id: category.id, path: category.path }).from(category);
  const animalId = new Map(animals.map((r): [string, number] => [r.path, r.id]));

  for (const a of ANIMALS) {
    const parentId = animalId.get(a.slug);
    if (!parentId) continue;
    let subOrder = 0;
    for (const s of SUBCATEGORIES) {
      subOrder += 10;
      await db
        .insert(category)
        .values({ path: `${a.slug}/${s.slug}`, slug: s.slug, name: s.name, parentId, sortOrder: subOrder })
        .onConflictDoNothing({ target: category.path });
    }
  }
}

/** path → id, e.g. "hund/trockenfutter" → 12 */
export async function loadCategoryIds(): Promise<Map<string, number>> {
  const rows = await getDb().select({ id: category.id, path: category.path }).from(category);
  return new Map(rows.map((r): [string, number] => [r.path, r.id]));
}
