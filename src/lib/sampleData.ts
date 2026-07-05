import type { FuturesInstrument, JournalDay, PriceBar } from "../types";

const nqJune: FuturesInstrument = {
  symbol: "NQ",
  contract: "NQM2026",
  name: "Nasdaq 100 E-mini",
  exchange: "CME",
  timezone: "America/Chicago",
  tickSize: 0.25,
  tickValue: 5,
  currency: "USD",
  sessionLabel: "Regular Trading Hours",
};

function buildBars(): PriceBar[] {
  const start = new Date("2026-04-16T08:30:00-05:00").getTime();
  const closes = [
    18342.75, 18346.5, 18339.75, 18334.5, 18331.25, 18328.75, 18336.0,
    18344.25, 18349.5, 18353.25, 18347.75, 18341.0, 18337.75, 18343.25,
    18351.75, 18358.0, 18363.5, 18359.75, 18355.25, 18361.0,
  ];

  return closes.map((close, index) => {
    const previousClose = closes[Math.max(index - 1, 0)];
    const base = index === 0 ? close - 3.25 : previousClose;
    const high = Math.max(base, close) + 2.25;
    const low = Math.min(base, close) - 2.0;

    return {
      time: new Date(start + index * 5 * 60 * 1000).toISOString(),
      open: Number(base.toFixed(2)),
      high: Number(high.toFixed(2)),
      low: Number(low.toFixed(2)),
      close,
      volume: 800 + index * 45,
    };
  });
}

export const sampleJournalDay: JournalDay = {
  id: "2026-04-16-nq-rth",
  date: "2026-04-16",
  instrument: nqJune,
  bars: buildBars(),
  trades: [
    {
      id: "trade-1",
      instrumentSymbol: "NQ",
      side: "long",
      contracts: 2,
      entryPrice: 18331.5,
      exitPrice: 18344.0,
      openedAt: "2026-04-16T08:55:00-05:00",
      closedAt: "2026-04-16T09:10:00-05:00",
      setup: "Opening flush reversal",
      tags: ["A+ setup", "Patience", "VWAP reclaim"],
      notes:
        "Waited for the second drive lower to fail, then entered on reclaim through the opening range low.",
      confidence: 0.82,
      ruleAdherence: 0.95,
    },
    {
      id: "trade-2",
      instrumentSymbol: "NQ",
      side: "short",
      contracts: 1,
      entryPrice: 18358.0,
      exitPrice: 18360.5,
      openedAt: "2026-04-16T09:45:00-05:00",
      closedAt: "2026-04-16T09:55:00-05:00",
      setup: "Trend exhaustion fade",
      tags: ["Countertrend", "Too early"],
      notes:
        "Shorted the first push into prior session highs instead of waiting for a lower high.",
      confidence: 0.44,
      ruleAdherence: 0.55,
    },
  ],
  notes:
    "Best read was the opening reversal after sellers failed to expand range. The second trade was forced and outside plan.",
};
