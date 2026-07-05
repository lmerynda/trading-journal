#!/usr/bin/env node

const DEFAULT_SYMBOL = "OPRA:SPXW260702C7500.0";
const DEFAULT_DATE = "2026-07-02";
const API_BASE = "https://api.marketdata.app/v1";

function parseArgs(argv) {
  const args = {
    symbol: DEFAULT_SYMBOL,
    date: DEFAULT_DATE,
    includeWindow: false,
    live: false,
    token: process.env.MARKETDATA_TOKEN || process.env.VITE_MARKETDATA_API_TOKEN || "",
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = argv[index + 1];

    if (arg === "--symbol" && next) {
      args.symbol = next;
      index += 1;
    } else if (arg === "--date" && next) {
      args.date = next;
      index += 1;
    } else if (arg === "--token" && next) {
      args.token = next;
      index += 1;
    } else if (arg === "--include-window") {
      args.includeWindow = true;
    } else if (arg === "--live") {
      args.live = true;
    } else if (arg === "--help" || arg === "-h") {
      args.help = true;
    } else {
      throw new Error(`Unknown or incomplete argument: ${arg}`);
    }
  }

  return args;
}

function usage() {
  return `
Explore MarketData option quote capabilities for one contract.

Default target:
  symbol: ${DEFAULT_SYMBOL}
  date:   ${DEFAULT_DATE}

Usage:
  npm run explore:marketdata-option
  MARKETDATA_TOKEN=... npm run explore:marketdata-option -- --live
  MARKETDATA_TOKEN=... npm run explore:marketdata-option -- --live --include-window

Options:
  --live             Send requests. Without this, the script prints a dry run.
  --include-window   Add a small EOD date window around the target date.
  --symbol <symbol>  Override the option symbol.
  --date <YYYY-MM-DD>
  --token <token>    Override MARKETDATA_TOKEN / VITE_MARKETDATA_API_TOKEN.
`;
}

function buildUrl(symbol, params) {
  const url = new URL(`${API_BASE}/options/quotes/${encodeURIComponent(symbol)}/`);

  for (const [key, value] of Object.entries(params)) {
    if (value) {
      url.searchParams.set(key, value);
    }
  }

  return url;
}

function normalizeOptionSymbol(symbol) {
  const match = symbol.match(/^OPRA:([A-Z]+)(\d{6})([CP])(\d+(?:\.\d+)?)$/i);
  if (!match) {
    return symbol;
  }

  const [, root, expiration, side, strikeText] = match;
  const strike = Number.parseFloat(strikeText);
  if (!Number.isFinite(strike)) {
    return symbol;
  }

  const encodedStrike = Math.round(strike * 1000).toString().padStart(8, "0");
  return `${root.toUpperCase()}${expiration}${side.toUpperCase()}${encodedStrike}`;
}

function addDays(dateText, days) {
  const date = new Date(`${dateText}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function planRequests({ symbol, date, includeWindow }) {
  const apiSymbol = normalizeOptionSymbol(symbol);
  const requests = [
    {
      label: "target-date-eod-quote",
      url: buildUrl(apiSymbol, { date }),
      purpose: "Historical end-of-day quote snapshot for the requested trading day.",
    },
  ];

  if (includeWindow) {
    requests.push({
      label: "neighboring-eod-series",
      url: buildUrl(apiSymbol, {
        from: addDays(date, -1),
        to: addDays(date, 1),
      }),
      purpose: "Small end-of-day series to see whether the API returns surrounding movement.",
    });
  }

  return requests;
}

function toRows(payload) {
  if (!payload || typeof payload !== "object") {
    return [];
  }

  const arrayKeys = Object.entries(payload)
    .filter(([, value]) => Array.isArray(value))
    .map(([key]) => key);

  const length = Math.max(0, ...arrayKeys.map((key) => payload[key].length));

  return Array.from({ length }, (_, index) => {
    const row = {};
    for (const key of arrayKeys) {
      row[key] = payload[key][index];
    }
    return row;
  });
}

function summarizeQuoteRows(rows) {
  return rows.map((row) => ({
    optionSymbol: row.optionSymbol,
    updatedEastern: row.updated ? new Date(row.updated * 1000).toLocaleString("en-US", {
      timeZone: "America/New_York",
      hour12: false,
    }) : null,
    bid: row.bid,
    ask: row.ask,
    mid: row.mid,
    last: row.last,
    volume: row.volume,
    openInterest: row.openInterest,
    underlyingPrice: row.underlyingPrice,
    iv: row.iv,
    delta: row.delta,
    gamma: row.gamma,
    theta: row.theta,
    vega: row.vega,
  }));
}

async function fetchJson(url, token) {
  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  const text = await response.text();
  let payload;
  try {
    payload = JSON.parse(text);
  } catch {
    payload = { raw: text };
  }

  return {
    status: response.status,
    ok: response.status === 200 || response.status === 203,
    payload,
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.help) {
    console.log(usage().trim());
    return;
  }

  const requests = planRequests(args);
  const apiSymbol = normalizeOptionSymbol(args.symbol);

  console.log(`MarketData option exploration`);
  console.log(`Input symbol: ${args.symbol}`);
  console.log(`API symbol: ${apiSymbol}`);
  console.log(`Date: ${args.date}`);
  console.log(`Planned requests: ${requests.length}`);
  console.log(`Mode: ${args.live ? "live" : "dry-run"}`);
  console.log("");

  for (const [index, request] of requests.entries()) {
    console.log(`${index + 1}. ${request.label}`);
    console.log(`   ${request.purpose}`);
    console.log(`   ${request.url.toString()}`);
  }

  if (!args.live) {
    console.log("");
    console.log("Dry run only. Add --live and MARKETDATA_TOKEN to send requests.");
    return;
  }

  if (!args.token) {
    throw new Error("Missing MARKETDATA_TOKEN, VITE_MARKETDATA_API_TOKEN, or --token.");
  }

  console.log("");
  console.log("Sending live requests...");

  for (const request of requests) {
    const result = await fetchJson(request.url, args.token);
    const rows = toRows(result.payload);

    console.log("");
    console.log(`## ${request.label}`);
    console.log(`HTTP ${result.status}`);

    if (!result.ok) {
      console.log(JSON.stringify(result.payload, null, 2));
      continue;
    }

    console.table(summarizeQuoteRows(rows));
    console.log("Raw status:", result.payload.s);
    console.log("Rows:", rows.length);
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
