import { jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";

// Phase 0: only a key/value table for runtime settings (job schedules etc., editable in /admin later).
// Phase 1 adds the full data model: product, offer, price_history, shop, network, feed_import_run, match_review.
// The first migration (drizzle/0000_*.sql) is generated in Phase 1 with `npm run db:generate`,
// so drizzle-kit owns all snapshots from the start. Until then the migrate step is a no-op.

export const appSetting = pgTable("app_setting", {
  key: text("key").primaryKey(),
  value: jsonb("value").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
