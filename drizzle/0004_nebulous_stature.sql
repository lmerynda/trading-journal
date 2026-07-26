ALTER TABLE "trades" ADD COLUMN "initial_notes" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "trades" ADD COLUMN "final_notes" text DEFAULT '' NOT NULL;--> statement-breakpoint
UPDATE "trades"
SET "initial_notes" = concat_ws(E'\n\n',
	CASE WHEN btrim("thesis") <> '' THEN '## Thesis' || E'\n\n' || "thesis" END,
	CASE WHEN btrim("entry_trigger") <> '' THEN '## Entry trigger' || E'\n\n' || "entry_trigger" END,
	CASE WHEN btrim("invalidation") <> '' THEN '## Invalidation' || E'\n\n' || "invalidation" END,
	CASE WHEN btrim("management_plan") <> '' THEN '## Management plan' || E'\n\n' || "management_plan" END
),
"final_notes" = concat_ws(E'\n\n',
	CASE WHEN btrim("actual_management") <> '' THEN '## Actual management' || E'\n\n' || "actual_management" END,
	CASE WHEN btrim("outcome_assessment") <> '' THEN '## Outcome assessment' || E'\n\n' || "outcome_assessment" END,
	CASE WHEN btrim("lesson") <> '' THEN '## Lesson' || E'\n\n' || "lesson" END,
	CASE WHEN btrim("notes") <> '' THEN '## Additional notes' || E'\n\n' || "notes" END
);--> statement-breakpoint
ALTER TABLE "trades" DROP COLUMN "thesis";--> statement-breakpoint
ALTER TABLE "trades" DROP COLUMN "entry_trigger";--> statement-breakpoint
ALTER TABLE "trades" DROP COLUMN "invalidation";--> statement-breakpoint
ALTER TABLE "trades" DROP COLUMN "management_plan";--> statement-breakpoint
ALTER TABLE "trades" DROP COLUMN "actual_management";--> statement-breakpoint
ALTER TABLE "trades" DROP COLUMN "outcome_assessment";--> statement-breakpoint
ALTER TABLE "trades" DROP COLUMN "lesson";--> statement-breakpoint
ALTER TABLE "trades" DROP COLUMN "notes";