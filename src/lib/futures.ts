import type { FuturesInstrument, Trade } from "./types";

export function calculateTicks(
  entryPrice: number,
  exitPrice: number,
  tickSize: number,
  side: Trade["side"],
): number {
  const rawTicks = (exitPrice - entryPrice) / tickSize;
  return side === "long" ? rawTicks : rawTicks * -1;
}

export function calculateTradePnl(
  trade: Trade,
  instrument: FuturesInstrument,
): number {
  const ticks = calculateTicks(
    trade.entryPrice,
    trade.exitPrice,
    instrument.tickSize,
    trade.side,
  );

  return ticks * instrument.tickValue * trade.contracts;
}

export function formatCurrency(value: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatPercent(value: number): string {
  return `${Math.round(value * 100)}%`;
}
