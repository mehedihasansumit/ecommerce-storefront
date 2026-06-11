ALTER TABLE "users" ADD COLUMN "avatar_url" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "avatar_position" jsonb DEFAULT '{"x":50,"y":50,"zoom":1}'::jsonb NOT NULL;