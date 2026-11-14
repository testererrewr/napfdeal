import { sql } from "drizzle-orm";
import { getDb } from "@/lib/db";

/**
 * Removes everything that came from test networks (network.is_test = true):
 * offers (+ price history, review items via cascade), products that only had test offers,
 * feeds, runs, shops and the networks themselves. Real data is untouched.
 */
export async function purgeTestData(): Promise<{ offers: number; products: number }> {
  const db = getDb();
  return db.transaction(async (tx) => {
    const testShops = sql`select s.id from shop s join network n on n.id = s.network_id where n.is_test`;

    const touched = await tx.execute(sql`
      select distinct product_id from offer where shop_id in (${testShops}) and product_id is not null
    `);
    const productIds = Array.from(touched as unknown as Array<{ product_id: number }>).map((r) => r.product_id);

    const deletedOffers = await tx.execute(sql`delete from offer where shop_id in (${testShops}) returning id`);

    let products = 0;
    if (productIds.length > 0) {
      const deletedProducts = await tx.execute(sql`
        delete from product p
        where p.id in (${sql.join(productIds.map((id) => sql`${id}`), sql`, `)})
          and not exists (select 1 from offer o where o.product_id = p.id)
        returning id
      `);
      products = Array.from(deletedProducts as unknown as unknown[]).length;
    }

    await tx.execute(sql`delete from feed_import_run where network_id in (select id from network where is_test)`);
    await tx.execute(sql`delete from feed where network_id in (select id from network where is_test)`);
    await tx.execute(sql`delete from shop where network_id in (select id from network where is_test)`);
    await tx.execute(sql`delete from network where is_test`);

    return { offers: Array.from(deletedOffers as unknown as unknown[]).length, products };
  });
}
