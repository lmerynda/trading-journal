import { z } from "zod";
import sanitizeHtml from "sanitize-html";

const commentBody = z
  .string()
  .max(10_000)
  .transform((body) =>
    sanitizeHtml(body, {
      allowedTags: ["p", "br", "strong", "b", "em", "i", "ul", "ol", "li", "a"],
      allowedAttributes: { a: ["href", "target", "rel"] },
      allowedSchemes: ["http", "https", "mailto"],
      transformTags: {
        a: sanitizeHtml.simpleTransform("a", {
          target: "_blank",
          rel: "nofollow noreferrer",
        }),
      },
    }),
  )
  .refine((body) => sanitizeHtml(body, { allowedTags: [] }).trim().length > 0);

export const commentInput = z.object({
  parentId: z.uuid().nullable(),
  authorName: z.string().trim().min(1).max(60),
  body: commentBody,
});

export const reactionInput = z.object({
  value: z.union([z.literal(-1), z.literal(1)]),
});
