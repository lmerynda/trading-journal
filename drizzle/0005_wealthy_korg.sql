CREATE TABLE "trade_comments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"trade_id" uuid NOT NULL,
	"parent_id" uuid,
	"author_name" text NOT NULL,
	"body" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "trades" ADD COLUMN "likes" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "trades" ADD COLUMN "dislikes" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "trade_comments" ADD CONSTRAINT "trade_comments_trade_id_trades_id_fk" FOREIGN KEY ("trade_id") REFERENCES "public"."trades"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trade_comments" ADD CONSTRAINT "trade_comments_parent_id_trade_comments_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."trade_comments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "trade_comments_trade_id_idx" ON "trade_comments" USING btree ("trade_id");