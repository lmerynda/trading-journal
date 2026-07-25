import {
    date,
    index,
    integer,
    pgEnum,
    pgTable,
    primaryKey,
    text,
    timestamp,
    uuid,
} from "drizzle-orm/pg-core";

export const applicationMetadata = pgTable("application_metadata", {
    key: text("key").primaryKey(),
    value: text("value").notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
        .defaultNow()
        .notNull(),
});

export const tradeDirection = pgEnum("trade_direction", ["long", "short"]);

export const trades = pgTable(
    "trades",
    {
        id: uuid("id").defaultRandom().primaryKey(),
        title: text("title").notNull(),
        tradeDate: date("trade_date").notNull(),
        direction: tradeDirection("direction").notNull(),
        notes: text("notes").default("").notNull(),
        createdAt: timestamp("created_at", { withTimezone: true })
            .defaultNow()
            .notNull(),
        updatedAt: timestamp("updated_at", { withTimezone: true })
            .defaultNow()
            .notNull(),
    },
    (table) => [index("trades_trade_date_idx").on(table.tradeDate)],
);

export const tradeImages = pgTable(
    "trade_images",
    {
        id: uuid("id").defaultRandom().primaryKey(),
        tradeId: uuid("trade_id")
            .notNull()
            .references(() => trades.id, { onDelete: "cascade" }),
        position: integer("position").notNull(),
        objectKey: text("object_key").notNull().unique(),
        filename: text("filename").notNull(),
        mimeType: text("mime_type").notNull(),
        byteSize: integer("byte_size").notNull(),
        createdAt: timestamp("created_at", { withTimezone: true })
            .defaultNow()
            .notNull(),
    },
    (table) => [index("trade_images_trade_id_idx").on(table.tradeId)],
);

export const tags = pgTable("tags", {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull().unique(),
});

export const tradeTags = pgTable(
    "trade_tags",
    {
        tradeId: uuid("trade_id")
            .notNull()
            .references(() => trades.id, { onDelete: "cascade" }),
        tagId: uuid("tag_id")
            .notNull()
            .references(() => tags.id, { onDelete: "cascade" }),
    },
    (table) => [primaryKey({ columns: [table.tradeId, table.tagId] })],
);
