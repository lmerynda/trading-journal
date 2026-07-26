import { describe, expect, it } from "vitest";
import { updateTradeInput } from "../src/app/api/trades/validation";

const validReview = {
  title: "Pullback entry",
  date: "2026-07-25",
  direction: "long" as const,
  initialNotes: "",
  finalNotes: "",
  youtubeUrl: null,
  tags: [],
};

describe("trade update validation", () => {
  it("accepts empty note fields", () => {
    expect(updateTradeInput.parse(validReview)).toEqual(validReview);
  });

  it("limits each note field to 50,000 characters", () => {
    expect(
      updateTradeInput.safeParse({
        ...validReview,
        initialNotes: "x".repeat(50_001),
      }).success,
    ).toBe(false);
  });
});
