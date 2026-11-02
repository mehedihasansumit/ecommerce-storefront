ALTER TABLE "categories" ADD COLUMN "size_guide" jsonb;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "details" jsonb DEFAULT '[]'::jsonb NOT NULL;