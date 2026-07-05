import { useEffect, useMemo, useState } from "react";
import { sampleJournalDay } from "./lib/sampleData";
import { buildJournalStats } from "./lib/stats";
import { calculateTradePnl, calculateTicks, formatCurrency, formatPercent } from "./lib/futures";
import type { ReplaySpeed } from "./types";

const speedOptions: ReplaySpeed[] = [1, 2, 4, 8];

export function App() {
  const [cursor, setCursor] = useState(7);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState<ReplaySpeed>(2);
  const [selectedTradeId, setSelectedTradeId] = useState(sampleJournalDay.trades[0]?.id ?? "");

  const visibleBars = sampleJournalDay.bars.slice(0, cursor + 1);
  const activeBar = visibleBars[visibleBars.length - 1];

  useEffect(() => {
    if (!isPlaying) {
      return;
    }

    const timer = window.setInterval(() => {
      setCursor((current) => {
        if (current >= sampleJournalDay.bars.length - 1) {
          setIsPlaying(false);
          return current;
        }

        return current + 1;
      });
    }, 1200 / speed);

    return () => window.clearInterval(timer);
  }, [isPlaying, speed]);

  const stats = useMemo(
    () => buildJournalStats(sampleJournalDay.trades, sampleJournalDay.instrument),
    [],
  );

  const selectedTrade =
    sampleJournalDay.trades.find((trade) => trade.id === selectedTradeId) ??
    sampleJournalDay.trades[0];

  const chartMin = Math.min(...visibleBars.map((bar) => bar.low));
  const chartMax = Math.max(...visibleBars.map((bar) => bar.high));
  const priceRange = chartMax - chartMin || 1;

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <p className="eyebrow">Trading Journal MVP</p>
        <h1>Futures replay and review</h1>
        <p className="lede">
          Start with deterministic replay, structured journaling, and stats that reflect
          actual futures tick economics.
        </p>

        <section className="panel">
          <div className="panel-header">
            <h2>Session</h2>
            <span>{sampleJournalDay.date}</span>
          </div>
          <dl className="meta-grid">
            <div>
              <dt>Contract</dt>
              <dd>{sampleJournalDay.instrument.contract}</dd>
            </div>
            <div>
              <dt>Instrument</dt>
              <dd>{sampleJournalDay.instrument.name}</dd>
            </div>
            <div>
              <dt>Tick size</dt>
              <dd>{sampleJournalDay.instrument.tickSize}</dd>
            </div>
            <div>
              <dt>Tick value</dt>
              <dd>{formatCurrency(sampleJournalDay.instrument.tickValue)}</dd>
            </div>
          </dl>
        </section>

        <section className="panel">
          <div className="panel-header">
            <h2>Stats</h2>
            <span>{stats.totalTrades} trades</span>
          </div>
          <div className="stat-grid">
            <StatCard label="Net PnL" value={formatCurrency(stats.netPnl)} accent="good" />
            <StatCard label="Average Trade" value={formatCurrency(stats.averagePnl)} />
            <StatCard label="Win Rate" value={formatPercent(stats.winRate)} />
            <StatCard label="Best Setup" value={stats.bestSetup} />
          </div>
        </section>
      </aside>

      <main className="content">
        <section className="hero">
          <div>
            <p className="eyebrow">Replay</p>
            <h2>{sampleJournalDay.instrument.symbol} focused review</h2>
          </div>
          <div className="hero-actions">
            <button
              className="button"
              onClick={() => setCursor((current) => Math.max(0, current - 1))}
            >
              Step back
            </button>
            <button className="button button-strong" onClick={() => setIsPlaying((value) => !value)}>
              {isPlaying ? "Pause" : "Play"}
            </button>
            <button
              className="button"
              onClick={() =>
                setCursor((current) => Math.min(sampleJournalDay.bars.length - 1, current + 1))
              }
            >
              Step forward
            </button>
          </div>
        </section>

        <section className="panel chart-panel">
          <div className="panel-header">
            <h2>Price development</h2>
            <span>
              Bar {cursor + 1} / {sampleJournalDay.bars.length}
            </span>
          </div>
          <div className="replay-toolbar">
            <div className="speed-group">
              {speedOptions.map((option) => (
                <button
                  key={option}
                  className={option === speed ? "chip chip-active" : "chip"}
                  onClick={() => setSpeed(option)}
                >
                  {option}x
                </button>
              ))}
            </div>
            <div className="bar-readout">
              <span>{new Date(activeBar.time).toLocaleTimeString("en-US", { timeStyle: "short" })}</span>
              <span>Close {activeBar.close.toFixed(2)}</span>
              <span>Vol {activeBar.volume}</span>
            </div>
          </div>
          <div className="chart">
            {visibleBars.map((bar) => {
              const high = ((chartMax - bar.high) / priceRange) * 100;
              const low = ((chartMax - bar.low) / priceRange) * 100;
              const open = ((chartMax - bar.open) / priceRange) * 100;
              const close = ((chartMax - bar.close) / priceRange) * 100;
              const bullish = bar.close >= bar.open;

              return (
                <div key={bar.time} className="candle-slot">
                  <div className="wick" style={{ top: `${high}%`, height: `${low - high}%` }} />
                  <div
                    className={bullish ? "candle candle-up" : "candle candle-down"}
                    style={{
                      top: `${Math.min(open, close)}%`,
                      height: `${Math.max(8, Math.abs(close - open))}%`,
                    }}
                  />
                </div>
              );
            })}
          </div>
        </section>

        <section className="lower-grid">
          <section className="panel">
            <div className="panel-header">
              <h2>Trade log</h2>
              <span>{stats.winners}W / {stats.losers}L</span>
            </div>
            <div className="trade-list">
              {sampleJournalDay.trades.map((trade) => {
                const pnl = calculateTradePnl(trade, sampleJournalDay.instrument);
                const ticks = calculateTicks(
                  trade.entryPrice,
                  trade.exitPrice,
                  sampleJournalDay.instrument.tickSize,
                  trade.side,
                );

                return (
                  <button
                    key={trade.id}
                    className={trade.id === selectedTrade.id ? "trade-card trade-card-active" : "trade-card"}
                    onClick={() => setSelectedTradeId(trade.id)}
                  >
                    <div className="trade-card-top">
                      <strong>{trade.setup}</strong>
                      <span className={pnl >= 0 ? "pill pill-good" : "pill pill-bad"}>
                        {formatCurrency(pnl)}
                      </span>
                    </div>
                    <p>
                      {trade.side.toUpperCase()} {trade.contracts} contracts, {ticks.toFixed(0)} ticks
                    </p>
                    <p className="muted">{trade.notes}</p>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="panel">
            <div className="panel-header">
              <h2>Review notes</h2>
              <span>{selectedTrade.tags.join(" · ")}</span>
            </div>
            <div className="review-stack">
              <ReviewRow label="Entry" value={selectedTrade.entryPrice.toFixed(2)} />
              <ReviewRow label="Exit" value={selectedTrade.exitPrice.toFixed(2)} />
              <ReviewRow label="Confidence" value={formatPercent(selectedTrade.confidence)} />
              <ReviewRow label="Rule adherence" value={formatPercent(selectedTrade.ruleAdherence)} />
              <ReviewRow label="Session note" value={sampleJournalDay.notes} multiline />
              <ReviewRow label="Trade note" value={selectedTrade.notes} multiline />
            </div>
          </section>
        </section>
      </main>
    </div>
  );
}

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: "good";
}) {
  return (
    <article className={accent === "good" ? "stat-card stat-card-good" : "stat-card"}>
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

function ReviewRow({
  label,
  value,
  multiline = false,
}: {
  label: string;
  value: string;
  multiline?: boolean;
}) {
  return (
    <div className={multiline ? "review-row review-row-multiline" : "review-row"}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
