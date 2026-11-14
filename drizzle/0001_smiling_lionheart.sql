CREATE TABLE "click_stat" (
	"day" date NOT NULL,
	"offer_id" integer NOT NULL,
	"country" text NOT NULL,
	"source" text NOT NULL,
	"clicks" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "click_stat_day_offer_id_source_pk" PRIMARY KEY("day","offer_id","source")
);
--> statement-breakpoint
CREATE TABLE "product_daily" (
	"product_id" integer NOT NULL,
	"country" text NOT NULL,
	"day" date NOT NULL,
	"best_cents" integer NOT NULL,
	"offer_count" integer NOT NULL,
	CONSTRAINT "product_daily_product_id_country_day_pk" PRIMARY KEY("product_id","country","day")
);
--> statement-breakpoint
CREATE TABLE "product_stats" (
	"product_id" integer NOT NULL,
	"country" text NOT NULL,
	"best_cents" integer NOT NULL,
	"best_offer_id" integer NOT NULL,
	"best_unit_price_cents" integer,
	"offer_count" integer NOT NULL,
	"median30_cents" integer,
	"days30" integer DEFAULT 0 NOT NULL,
	"prev_best_cents" integer,
	"prev_best_day" date,
	"min90_cents" integer,
	"lowest_since_days" integer,
	"history_days" integer DEFAULT 0 NOT NULL,
	"checked_at" timestamp with time zone NOT NULL,
	"computed_at" timestamp with time zone NOT NULL,
	CONSTRAINT "product_stats_product_id_country_pk" PRIMARY KEY("product_id","country")
);
--> statement-breakpoint
ALTER TABLE "product" ADD COLUMN "is_test" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "click_stat" ADD CONSTRAINT "click_stat_offer_id_offer_id_fk" FOREIGN KEY ("offer_id") REFERENCES "public"."offer"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_daily" ADD CONSTRAINT "product_daily_product_id_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."product"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_stats" ADD CONSTRAINT "product_stats_product_id_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."product"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "product_stats_country_idx" ON "product_stats" USING btree ("country");