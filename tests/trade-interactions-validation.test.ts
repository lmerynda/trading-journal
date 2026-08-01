import { describe, expect, it } from "vitest";
import {
  commentInput,
  reactionInput,
} from "../src/app/api/trades/[id]/interactions/validation";

const comment = {
  parentId: null,
  authorName: "Alex",
  body: "<p>A <strong>useful</strong> observation.</p>",
};

describe("trade interaction validation", () => {
  it("keeps supported rich-text formatting", () => {
    expect(commentInput.parse(comment).body).toBe(comment.body);
  });

  it("removes unsafe comment markup", () => {
    expect(
      commentInput.parse({
        ...comment,
        body: '<p>Safe</p><script>alert("no")</script>',
      }).body,
    ).toBe("<p>Safe</p>");
  });

  it("rejects comments without visible text", () => {
    expect(commentInput.safeParse({ ...comment, body: "<br>" }).success).toBe(
      false,
    );
  });

  it("accepts only like and dislike reactions", () => {
    expect(reactionInput.safeParse({ value: 1 }).success).toBe(true);
    expect(reactionInput.safeParse({ value: -1 }).success).toBe(true);
    expect(reactionInput.safeParse({ value: 0 }).success).toBe(false);
  });
});
