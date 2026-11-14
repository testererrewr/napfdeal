/**
 * Recomputes product_daily (today's best total per product and country) and product_stats
 * (current best, 30-day median, previous day, 90-day low, "lowest since"). Runs in the worker
 * after imports and once a day after midnight. All in one transaction.
 */
import { sql } from "drizzle-orm";
import { getDb } from "@/lib/db";

const TZ = process.env.JOB_TIMEZONE ?? "Europe/Vienna";
const DAILY_RETENTION_DAYS = 400;

const OFFER_USABLE = sql`o.product_id is not null and o.active and o.available and not o.price_suspect and s.enabled`;

export async function recomputeStats(): Promise<{ products: number }> {
  return getDb().transaction(async (tx) => {
    await tx.execute(sql`
      insert into product_daily (product_id, country, day, best_cents, offer_count)
      select o.product_id, o.country, (now() at time zone ${TZ})::date,
             min(o.price_cents + coalesce(o.shipping_cents, 0))::int, count(*)::int
      from offer o join shop s on s.id = o.shop_id
      where ${OFFER_USABLE}
      group by o.product_id, o.country
      on conflict (product_id, country, day) do update
        set best_cents = least(product_daily.best_cents, excluded.best_cents),
            offer_count = excluded.offer_count
    `);

    const upserted = await tx.execute(sql`
      with today as (select (now() at time zone ${TZ})::date as d),
      cur as (
        select distinct on (o.product_id, o.country)
               o.product_id, o.country, o.id as offer_id,
               (o.price_cents + coalesce(o.shipping_cents, 0)) as total,
               o.unit_price_cents, o.checked_at,
               count(*) over (partition by o.product_id, o.country)::int as cnt
        from offer o join shop s on s.id = o.shop_id
        where ${OFFER_USABLE}
        order by o.product_id, o.country, total, o.id
      )
      insert into product_stats (product_id, country, best_cents, best_offer_id, best_unit_price_cents, offer_count,
                                 median30_cents, days30, prev_best_cents, prev_best_day, min90_cents, lowest_since_days, history_days,
                                 checked_at, computed_at)
      select c.product_id, c.country, c.total, c.offer_id, c.unit_price_cents, c.cnt,
             m.median30, coalesce(m.days30, 0), p.prev_best, p.prev_day, m90.min90, ls.since, coalesce(hd.days, 0),
             c.checked_at, now()
      from cur c
      cross join today t
      left join lateral (
        select round(percentile_cont(0.5) within group (order by d.best_cents))::int as median30, count(*)::int as days30
        from product_daily d
        where d.product_id = c.product_id and d.country = c.country and d.day >= t.d - 30 and d.day < t.d
      ) m on true
      left join lateral (
        select d.best_cents as prev_best, d.day as prev_day from product_daily d
        where d.product_id = c.product_id and d.country = c.country and d.day < t.d
        order by d.day desc limit 1
      ) p on true
      left join lateral (
        select min(d.best_cents)::int as min90 from product_daily d
        where d.product_id = c.product_id and d.country = c.country and d.day >= t.d - 90 and d.day < t.d
      ) m90 on true
      left join lateral (
        select (t.d - max(d.day))::int as since from product_daily d
        where d.product_id = c.product_id and d.country = c.country and d.day < t.d and d.best_cents < c.total
      ) ls on true
      left join lateral (
        select count(*)::int as days from product_daily d
        where d.product_id = c.product_id and d.country = c.country and d.day < t.d
      ) hd on true
      on conflict (product_id, country) do update set
        best_cents = excluded.best_cents,
        best_offer_id = excluded.best_offer_id,
        best_unit_price_cents = excluded.best_unit_price_cents,
        offer_count = excluded.offer_count,
        median30_cents = excluded.median30_cents,
        days30 = excluded.days30,
        prev_best_cents = excluded.prev_best_cents,
        prev_best_day = excluded.prev_best_day,
        min90_cents = excluded.min90_cents,
        lowest_since_days = excluded.lowest_since_days,
        history_days = excluded.history_days,
        checked_at = excluded.checked_at,
        computed_at = excluded.computed_at
      returning product_id
    `);

    // Products without a usable offer right now drop out of lists (rows not touched in this transaction).
    await tx.execute(sql`delete from product_stats where computed_at < now()`);
    await tx.execute(sql`delete from product_daily where day < (now() at time zone ${TZ})::date - ${DAILY_RETENTION_DAYS}::int`);

    return { products: Array.from(upserted as unknown as unknown[]).length };
  });
}
