CREATE TYPE "public"."trade_direction" AS ENUM('long', 'short');--> statement-breakpoint
CREATE TABLE "tags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	CONSTRAINT "tags_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "trade_images" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"trade_id" uuid NOT NULL,
	"position" integer NOT NULL,
	"object_key" text NOT NULL,
	"filename" text NOT NULL,
	"mime_type" text NOT NULL,
	"byte_size" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "trade_images_object_key_unique" UNIQUE("object_key")
);
--> statement-breakpoint
CREATE TABLE "trade_tags" (
	"trade_id" uuid NOT NULL,
	"tag_id" uuid NOT NULL,
	CONSTRAINT "trade_tags_trade_id_tag_id_pk" PRIMARY KEY("trade_id","tag_id")
);
--> statement-breakpoint
CREATE TABLE "trades" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"trade_date" date NOT NULL,
	"direction" "trade_direction" NOT NULL,
	"notes" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "trade_images" ADD CONSTRAINT "trade_images_trade_id_trades_id_fk" FOREIGN KEY ("trade_id") REFERENCES "public"."trades"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trade_tags" ADD CONSTRAINT "trade_tags_trade_id_trades_id_fk" FOREIGN KEY ("trade_id") REFERENCES "public"."trades"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trade_tags" ADD CONSTRAINT "trade_tags_tag_id_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "trade_images_trade_id_idx" ON "trade_images" USING btree ("trade_id");--> statement-breakpoint
CREATE INDEX "trades_trade_date_idx" ON "trades" USING btree ("trade_date");