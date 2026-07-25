import type {
  TradeCatalogPort,
  TradeReviewRecord,
  TradeSearchFilter,
} from "../../ports/trade-catalog";

export interface TagFacetDto {
  name: string;
  count: number;
}

export interface DayActivityDto {
  date: string;
  count: number;
}

export interface PublicLibraryDto {
  trades: TradeReviewRecord[];
  tags: TagFacetDto[];
  days: DayActivityDto[];
}

export class QueryPublicLibrary {
  constructor(private readonly tradeCatalog: TradeCatalogPort) {}

  async execute(filter: TradeSearchFilter): Promise<PublicLibraryDto> {
    const [trades, allTrades] = await Promise.all([
      this.tradeCatalog.list(filter),
      this.tradeCatalog.list(),
    ]);
    const tagCounts = new Map<string, number>();
    const dayCounts = new Map<string, number>();

    for (const trade of allTrades) {
      dayCounts.set(trade.date, (dayCounts.get(trade.date) ?? 0) + 1);
      for (const tag of trade.tags) {
        tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1);
      }
    }

    return {
      trades,
      tags: Array.from(tagCounts, ([name, count]) => ({ name, count })).sort(
        (left, right) => left.name.localeCompare(right.name),
      ),
      days: Array.from(dayCounts, ([date, count]) => ({ date, count })).sort(
        (left, right) => left.date.localeCompare(right.date),
      ),
    };
  }
}
