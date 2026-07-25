import { z } from "zod";

const direction = z.enum(["long", "short"]);
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
export const imageRole = z.enum(["entry", "exits"]);

export const tradeId = z.uuid();

export const createTradeInput = z.object({
    title: z.string().trim().min(1).max(200),
    date,
    direction,
});

export const updateTradeInput = z.object({
    title: z.string().max(200),
    date,
    direction,
    notes: z.string().max(50_000),
    youtubeUrl: z
        .union([
            z.url().refine((value) => {
                const hostname = new URL(value).hostname.replace(/^www\./, "");
                return hostname === "youtube.com" || hostname === "youtu.be";
            }),
            z.literal(""),
            z.null(),
        ])
        .transform((value) => value || null),
    tags: z.array(z.string().trim().min(1).max(40)).max(20),
});
