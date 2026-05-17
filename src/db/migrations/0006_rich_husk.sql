CREATE TABLE "campaign_redemptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"campaign_id" uuid NOT NULL,
	"store_id" uuid NOT NULL,
	"user_id" uuid,
	"order_id" uuid NOT NULL,
	"rewards_applied" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"discount_amount" numeric(12, 2) DEFAULT '0' NOT NULL,
	"redeemed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "campaigns" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"store_id" uuid NOT NULL,
	"slug" text NOT NULL,
	"name" jsonb NOT NULL,
	"description" jsonb,
	"type" text NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"priority" integer DEFAULT 0 NOT NULL,
	"stackable" boolean DEFAULT false NOT NULL,
	"repeatable" boolean DEFAULT false NOT NULL,
	"audience" text DEFAULT 'all' NOT NULL,
	"min_cart_total" numeric(12, 2),
	"start_date" timestamp with time zone NOT NULL,
	"end_date" timestamp with time zone NOT NULL,
	"usage_limit" integer,
	"per_user_limit" integer,
	"usage_count" integer DEFAULT 0 NOT NULL,
	"conditions" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"rewards" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"excluded_product_ids" uuid[] DEFAULT '{}'::uuid[] NOT NULL,
	"banner_image" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ck_campaigns_type" CHECK ("campaigns"."type" IN ('bogo','bundle','tiered','freeGift')),
	CONSTRAINT "ck_campaigns_status" CHECK ("campaigns"."status" IN ('draft','active','paused','expired')),
	CONSTRAINT "ck_campaigns_audience" CHECK ("campaigns"."audience" IN ('all','firstOrder','loggedInOnly')),
	CONSTRAINT "ck_campaigns_date_range" CHECK ("campaigns"."end_date" > "campaigns"."start_date")
);
--> statement-breakpoint
ALTER TABLE "campaign_redemptions" ADD CONSTRAINT "campaign_redemptions_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_redemptions" ADD CONSTRAINT "campaign_redemptions_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_redemptions" ADD CONSTRAINT "campaign_redemptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_redemptions" ADD CONSTRAINT "campaign_redemptions_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_campaign_redemptions_campaign_user" ON "campaign_redemptions" USING btree ("campaign_id","user_id");--> statement-breakpoint
CREATE INDEX "idx_campaign_redemptions_store" ON "campaign_redemptions" USING btree ("store_id");--> statement-breakpoint
CREATE INDEX "idx_campaign_redemptions_order" ON "campaign_redemptions" USING btree ("order_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_campaigns_store_slug" ON "campaigns" USING btree ("store_id","slug");--> statement-breakpoint
CREATE INDEX "idx_campaigns_store_status_valid" ON "campaigns" USING btree ("store_id","status","end_date");--> statement-breakpoint
CREATE INDEX "idx_campaigns_store_priority" ON "campaigns" USING btree ("store_id","priority");