import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const applicationMetadata = pgTable("application_metadata", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});
