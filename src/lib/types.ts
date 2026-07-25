export type Side = "long" | "short";

export type ReplaySpeed = 1 | 2 | 4 | 8;

export interface FuturesInstrument {
  symbol: string;
  contract: string;
  name: string;
  exchange: string;
  timezone: string;
  tickSize: number;
  tickValue: number;
  currency: string;
  sessionLabel: string;
}

export interface PriceBar {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface Trade {
  id: string;
  instrumentSymbol: string;
  side: Side;
  contracts: number;
  entryPrice: number;
  exitPrice: number;
  openedAt: string;
  closedAt: string;
  setup: string;
  tags: string[];
  notes: string;
  confidence: number;
  ruleAdherence: number;
}

export interface ReplayState {
  cursor: number;
  isPlaying: boolean;
  speed: ReplaySpeed;
}

export interface JournalDay {
  id: string;
  date: string;
  instrument: FuturesInstrument;
  bars: PriceBar[];
  trades: Trade[];
  notes: string;
}
