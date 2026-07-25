CREATE TYPE "public"."trade_image_role" AS ENUM('entry', 'exits');--> statement-breakpoint
ALTER TABLE "trade_images" ADD COLUMN "role" "trade_image_role" DEFAULT 'entry' NOT NULL;--> statement-breakpoint
ALTER TABLE "trade_images" ALTER COLUMN "role" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "trades" ADD COLUMN "youtube_url" text;
