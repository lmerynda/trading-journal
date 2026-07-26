ALTER TABLE "trades" ADD COLUMN "thesis" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "trades" ADD COLUMN "entry_trigger" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "trades" ADD COLUMN "invalidation" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "trades" ADD COLUMN "management_plan" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "trades" ADD COLUMN "actual_management" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "trades" ADD COLUMN "outcome_assessment" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "trades" ADD COLUMN "lesson" text DEFAULT '' NOT NULL;