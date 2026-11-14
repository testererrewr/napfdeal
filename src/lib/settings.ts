import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { appSetting } from "@/lib/db/schema";

/** All runtime settings with defaults. Values in the DB override these (admin UI in Phase 8). */
export const SETTING_DEFAULTS = {
  /** Full refresh of every feed: twice a day, 05:30 and 17:30 (JOB_TIMEZONE) */
  "jobs.fullRefreshCron": "30 5,17 * * *",
  /** Hourly check whether a feed has new data */
  "jobs.feedCheckCron": "0 * * * *",
  /** One-step total price drop at/above this ratio is flagged suspect (0.6 = −60 %) */
  "pricing.suspectDropRatio": 0.6,
  /** Awin product feed columns we request. Verify against the Awin feed docs after approval. */
  "awin.columns": [
    "aw_product_id",
    "merchant_product_id",
    "product_name",
    "brand_name",
    "aw_deep_link",
    "merchant_image_url",
    "aw_image_url",
    "merchant_category",
    "category_name",
    "search_price",
    "currency",
    "delivery_cost",
    "ean",
    "product_GTIN",
    "upc",
    "in_stock",
    "stock_status",
    "base_price_text",
  ],
} as const;

export type SettingKey = keyof typeof SETTING_DEFAULTS;
type Widen<T> = T extends string ? string : T extends number ? number : T extends readonly (infer U)[] ? Widen<U>[] : T;
export type SettingValue<K extends SettingKey> = Widen<(typeof SETTING_DEFAULTS)[K]>;

export async function getSetting<K extends SettingKey>(key: K): Promise<SettingValue<K>> {
  const rows = await getDb().select({ value: appSetting.value }).from(appSetting).where(eq(appSetting.key, key)).limit(1);
  const v = rows[0]?.value;
  return (v === undefined || v === null ? SETTING_DEFAULTS[key] : v) as SettingValue<K>;
}

export async function setSetting<K extends SettingKey>(key: K, value: SettingValue<K>): Promise<void> {
  await getDb()
    .insert(appSetting)
    .values({ key, value })
    .onConflictDoUpdate({ target: appSetting.key, set: { value, updatedAt: new Date() } });
}
