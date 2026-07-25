import { describe, expect, it } from "vitest";
import {
  clearTradeSearchDates,
  parseTradeSearchQuery,
  serializeTradeSearch,
  setTradeSearchDateRange,
  toggleTradeSearchTag,
} from "../src/lib/trade-search";

describe("trade search query", () => {
  it("parses tags, dates, and free text", () => {
    expect(
      parseTradeSearchQuery(
        'tag:breakout tag:"opening range" from:2026-07-01 to:2026-07-31 stayed patient',
      ),
    ).toEqual({
      tags: ["breakout", "opening range"],
      from: "2026-07-01",
      to: "2026-07-31",
      text: "stayed patient",
      errors: [],
    });
  });

  it("reports malformed known clauses without losing free text", () => {
    expect(parseTradeSearchQuery("date:July patience")).toMatchObject({
      text: "patience",
      errors: ["date: requires a YYYY-MM-DD date."],
    });
  });

  it("round trips quoted tags", () => {
    const parsed = parseTradeSearchQuery('tag:"opening range" date:2026-07-25');
    expect(serializeTradeSearch(parsed)).toBe(
      'tag:"opening range" date:2026-07-25',
    );
  });

  it("toggles tags without changing other filters", () => {
    expect(toggleTradeSearchTag("date:2026-07-25 patience", "breakout")).toBe(
      "tag:breakout date:2026-07-25 patience",
    );
    expect(toggleTradeSearchTag("tag:breakout patience", "breakout")).toBe(
      "patience",
    );
  });

  it("sets one exact date and removes an existing range", () => {
    expect(
      setTradeSearchDateRange(
        "tag:breakout from:2026-07-01 to:2026-07-31",
        "2026-07-25",
      ),
    ).toBe("tag:breakout date:2026-07-25");
  });

  it("sets an inclusive date range in chronological order", () => {
    expect(
      setTradeSearchDateRange(
        "tag:breakout date:2026-07-25",
        "2026-07-18",
        "2026-07-22",
      ),
    ).toBe("tag:breakout from:2026-07-18 to:2026-07-22");
    expect(setTradeSearchDateRange("", "2026-07-22", "2026-07-18")).toBe(
      "from:2026-07-18 to:2026-07-22",
    );
  });

  it("clears every date clause without changing other filters", () => {
    expect(
      clearTradeSearchDates(
        "tag:breakout from:2026-07-18 to:2026-07-22 patience",
      ),
    ).toBe("tag:breakout patience");
  });
});
