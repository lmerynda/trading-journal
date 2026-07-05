import { calculateTradePnl } from "./futures";
import type { FuturesInstrument, Trade } from "../types";

export interface JournalStats {
  totalTrades: number;
  winners: number;
  losers: number;
  netPnl: number;
  averagePnl: number;
  winRate: number;
  bestSetup: string;
}

export function buildJournalStats(
  trades: Trade[],
  instrument: FuturesInstrument,
): JournalStats {
  const pnls = trades.map((trade) => calculateTradePnl(trade, instrument));
  const netPnl = pnls.reduce((total, pnl) => total + pnl, 0);
  const winners = pnls.filter((pnl) => pnl > 0).length;
  const losers = pnls.filter((pnl) => pnl <= 0).length;

  const setupScores = trades.reduce<Record<string, number>>((accumulator, trade) => {
    const tradePnl = calculateTradePnl(trade, instrument);
    accumulator[trade.setup] = (accumulator[trade.setup] ?? 0) + tradePnl;
    return accumulator;
  }, {});

  const bestSetup =
    Object.entries(setupScores).sort((left, right) => right[1] - left[1])[0]?.[0] ??
    "None yet";

  return {
    totalTrades: trades.length,
    winners,
    losers,
    netPnl,
    averagePnl: trades.length > 0 ? netPnl / trades.length : 0,
    winRate: trades.length > 0 ? winners / trades.length : 0,
    bestSetup,
  };
}
