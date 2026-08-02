import { z } from "zod";
import { publicMessageInput } from "../../../../../lib/public-message-validation";

export const commentInput = publicMessageInput.extend({
  parentId: z.uuid().nullable(),
});

export const reactionInput = z.object({
  value: z.union([z.literal(-1), z.literal(1)]),
});
