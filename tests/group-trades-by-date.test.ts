import { describe, expect, it } from "vitest";
import type { TradeReviewRecord } from "../src/backend/ports/trade-catalog";
import { groupTradesByDate } from "../src/lib/group-trades-by-date";

function trade(id: string, date: string): TradeReviewRecord {
  return {
    id,
    date,
    title: id,
    direction: "long",
    notes: "",
    youtubeUrl: null,
    tags: [],
    images: [],
    createdAt: "2026-07-25T12:00:00.000Z",
    updatedAt: "2026-07-25T12:00:00.000Z",
  };
}

describe("groupTradesByDate", () => {
  it("returns no groups for no trades", () => {
    expect(groupTradesByDate([])).toEqual([]);
  });

  it("keeps date groups and trades in input order", () => {
    const groups = groupTradesByDate([
      trade("first", "2026-07-25"),
      trade("second", "2026-07-25"),
      trade("third", "2026-07-24"),
    ]);

    expect(groups.map((group) => group.date)).toEqual([
      "2026-07-25",
      "2026-07-24",
    ]);
    expect(groups[0]?.trades.map(({ id }) => id)).toEqual(["first", "second"]);
    expect(groups[1]?.trades.map(({ id }) => id)).toEqual(["third"]);
  });

  it("counts only trades present in the filtered input", () => {
    const [group] = groupTradesByDate([
      trade("matching-first", "2026-07-25"),
      trade("matching-second", "2026-07-25"),
    ]);

    expect(group?.trades).toHaveLength(2);
  });
});
