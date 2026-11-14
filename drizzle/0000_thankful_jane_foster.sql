CREATE TABLE "app_setting" (
	"key" text PRIMARY KEY NOT NULL,
	"value" jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "category" (
	"id" serial PRIMARY KEY NOT NULL,
	"path" text NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"parent_id" integer,
	"note" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	CONSTRAINT "category_path_unique" UNIQUE("path")
);
--> statement-breakpoint
CREATE TABLE "feed" (
	"id" serial PRIMARY KEY NOT NULL,
	"network_id" integer NOT NULL,
	"shop_id" integer NOT NULL,
	"external_id" text NOT NULL,
	"name" text NOT NULL,
	"country" text NOT NULL,
	"language" text,
	"remote_version" text,
	"imported_version" text,
	"last_import_at" timestamp with time zone,
	"enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "feed_import_run" (
	"id" serial PRIMARY KEY NOT NULL,
	"network_id" integer,
	"feed_id" integer,
	"trigger" text NOT NULL,
	"status" text DEFAULT 'running' NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"finished_at" timestamp with time zone,
	"rows_total" integer DEFAULT 0 NOT NULL,
	"rows_skipped" integer DEFAULT 0 NOT NULL,
	"offers_created" integer DEFAULT 0 NOT NULL,
	"offers_updated" integer DEFAULT 0 NOT NULL,
	"offers_deactivated" integer DEFAULT 0 NOT NULL,
	"products_created" integer DEFAULT 0 NOT NULL,
	"price_changes" integer DEFAULT 0 NOT NULL,
	"suspects" integer DEFAULT 0 NOT NULL,
	"review_items" integer DEFAULT 0 NOT NULL,
	"errors" integer DEFAULT 0 NOT NULL,
	"error_message" text
);
--> statement-breakpoint
CREATE TABLE "match_review" (
	"id" serial PRIMARY KEY NOT NULL,
	"kind" text NOT NULL,
	"offer_id" integer,
	"product_id" integer,
	"candidate_product_id" integer,
	"score" real,
	"details" jsonb,
	"status" text DEFAULT 'open' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"resolved_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "network" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"is_test" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "network_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "offer" (
	"id" serial PRIMARY KEY NOT NULL,
	"shop_id" integer NOT NULL,
	"feed_id" integer,
	"product_id" integer,
	"external_id" text NOT NULL,
	"country" text NOT NULL,
	"title" text NOT NULL,
	"brand" text,
	"gtins" text[] DEFAULT '{}'::text[] NOT NULL,
	"price_cents" integer NOT NULL,
	"shipping_cents" integer,
	"currency" text DEFAULT 'EUR' NOT NULL,
	"unit_price_cents" integer,
	"available" boolean DEFAULT true NOT NULL,
	"deeplink" text NOT NULL,
	"image_url" text,
	"feed_category" text,
	"active" boolean DEFAULT true NOT NULL,
	"price_suspect" boolean DEFAULT false NOT NULL,
	"checked_at" timestamp with time zone NOT NULL,
	"price_changed_at" timestamp with time zone NOT NULL,
	"last_history_at" timestamp with time zone,
	"first_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_seen_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "price_history" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"offer_id" integer NOT NULL,
	"price_cents" integer NOT NULL,
	"shipping_cents" integer,
	"available" boolean NOT NULL,
	"suspect" boolean DEFAULT false NOT NULL,
	"kind" text NOT NULL,
	"recorded_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"brand" text,
	"brand_norm" text,
	"category_id" integer,
	"category_status" text DEFAULT 'auto' NOT NULL,
	"size_count" integer,
	"size_amount" double precision,
	"size_unit" text,
	"size_total" double precision,
	"size_base_unit" text,
	"size_label" text,
	"size_source" text,
	"size_status" text DEFAULT 'none' NOT NULL,
	"image_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "product_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "product_gtin" (
	"gtin" text PRIMARY KEY NOT NULL,
	"product_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shop" (
	"id" serial PRIMARY KEY NOT NULL,
	"network_id" integer NOT NULL,
	"external_id" text NOT NULL,
	"name" text NOT NULL,
	"country" text NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "feed" ADD CONSTRAINT "feed_network_id_network_id_fk" FOREIGN KEY ("network_id") REFERENCES "public"."network"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feed" ADD CONSTRAINT "feed_shop_id_shop_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shop"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feed_import_run" ADD CONSTRAINT "feed_import_run_network_id_network_id_fk" FOREIGN KEY ("network_id") REFERENCES "public"."network"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feed_import_run" ADD CONSTRAINT "feed_import_run_feed_id_feed_id_fk" FOREIGN KEY ("feed_id") REFERENCES "public"."feed"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match_review" ADD CONSTRAINT "match_review_offer_id_offer_id_fk" FOREIGN KEY ("offer_id") REFERENCES "public"."offer"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match_review" ADD CONSTRAINT "match_review_product_id_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."product"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match_review" ADD CONSTRAINT "match_review_candidate_product_id_product_id_fk" FOREIGN KEY ("candidate_product_id") REFERENCES "public"."product"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "offer" ADD CONSTRAINT "offer_shop_id_shop_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shop"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "offer" ADD CONSTRAINT "offer_feed_id_feed_id_fk" FOREIGN KEY ("feed_id") REFERENCES "public"."feed"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "offer" ADD CONSTRAINT "offer_product_id_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."product"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "price_history" ADD CONSTRAINT "price_history_offer_id_offer_id_fk" FOREIGN KEY ("offer_id") REFERENCES "public"."offer"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product" ADD CONSTRAINT "product_category_id_category_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."category"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_gtin" ADD CONSTRAINT "product_gtin_product_id_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."product"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shop" ADD CONSTRAINT "shop_network_id_network_id_fk" FOREIGN KEY ("network_id") REFERENCES "public"."network"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "category_parent_idx" ON "category" USING btree ("parent_id");--> statement-breakpoint
CREATE UNIQUE INDEX "feed_network_external_uq" ON "feed" USING btree ("network_id","external_id");--> statement-breakpoint
CREATE INDEX "feed_import_run_feed_started_idx" ON "feed_import_run" USING btree ("feed_id","started_at");--> statement-breakpoint
CREATE UNIQUE INDEX "match_review_open_offer_uq" ON "match_review" USING btree ("kind","offer_id") WHERE status = 'open' and offer_id is not null;--> statement-breakpoint
CREATE UNIQUE INDEX "match_review_open_product_uq" ON "match_review" USING btree ("kind","product_id") WHERE status = 'open' and product_id is not null;--> statement-breakpoint
CREATE INDEX "match_review_status_idx" ON "match_review" USING btree ("status","kind");--> statement-breakpoint
CREATE UNIQUE INDEX "offer_shop_external_uq" ON "offer" USING btree ("shop_id","external_id");--> statement-breakpoint
CREATE INDEX "offer_product_country_idx" ON "offer" USING btree ("product_id","country");--> statement-breakpoint
CREATE INDEX "offer_feed_seen_idx" ON "offer" USING btree ("feed_id","last_seen_at");--> statement-breakpoint
CREATE INDEX "price_history_offer_time_idx" ON "price_history" USING btree ("offer_id","recorded_at");--> statement-breakpoint
CREATE INDEX "product_brand_norm_idx" ON "product" USING btree ("brand_norm");--> statement-breakpoint
CREATE INDEX "product_category_idx" ON "product" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "product_gtin_product_idx" ON "product_gtin" USING btree ("product_id");--> statement-breakpoint
CREATE UNIQUE INDEX "shop_network_external_country_uq" ON "shop" USING btree ("network_id","external_id","country");