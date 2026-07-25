import type { TradeReviewRecord } from "@/backend/ports/trade-catalog";

export interface TradeDayGroup {
  date: string;
  trades: TradeReviewRecord[];
}

export function groupTradesByDate(
  trades: TradeReviewRecord[],
): TradeDayGroup[] {
  const groups: TradeDayGroup[] = [];

  for (const trade of trades) {
    const currentGroup = groups.at(-1);
    if (currentGroup?.date === trade.date) {
      currentGroup.trades.push(trade);
    } else {
      groups.push({ date: trade.date, trades: [trade] });
    }
  }

  return groups;
}
