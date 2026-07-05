# MarketDataApp research

## Expired options support

MarketDataApp documents support for historical options data on expired contracts.

- The options quotes guide says the API supports stock options, ETF options, and index options, with historical quotes going back to 2005.
- The options chain endpoint documents current or historical end-of-day option chains for an underlying symbol.
- The options data page says historical options coverage includes every U.S. listed contract, including expired, delisted, adjusted, and non-standard options.

## Relevance to SPX and NDX

The provider explicitly states support for index options. Based on that documentation, SPX and NDX should be in scope as U.S.-listed index options.

## Required trading coverage

The target trading workflows currently need two data families:

- Index options: NDX and SPX options, including SPXW weekly contracts.
- Futures candles: NQ/ES and MNQ/MES futures, ideally with intraday candle support.

For options strategy research, EOD snapshots are not enough. We need historical intraday movement for expired contracts, especially around specific intraday windows such as the final 20 minutes of the session.

For futures strategy context, the API also needs historical intraday candles for:

- `NQ` / `MNQ`
- `ES` / `MES`

The same vendor does not necessarily need to cover both options and futures, but using one provider would simplify symbol normalization, timestamp alignment, rate-limit handling, and local storage.

## Intraday options data

The official options docs currently describe:

- **Options quotes** as a current or **historical end-of-day** quote for a single options contract.
- **Options chain** as a current or **historical end-of-day** option chain for an underlying.

I did **not** find an official `options/candles` documentation page comparable to the stock candles endpoint.

That matters because the stock API explicitly documents intraday candle resolutions like `1`, `3`, `5`, `15`, and hourly values, while the options docs shown above do not.

## JavaScript SDK findings

MarketDataApp's JavaScript SDK is published as `@marketdata/sdk` and is open source at `MarketDataApp/sdk-js`.

The SDK options resource currently documents these methods:

- `client.options.chain(...)`
- `client.options.quotes(...)`
- `client.options.expirations(...)`
- `client.options.lookup(...)`

For option prices, the relevant SDK method is:

```ts
const quotes = await client.options.quotes("AAPL271217C00250000", {
  date: "2024-01-15",
});
```

The SDK docs say `quotes()` supports one or more OCC option symbols. For multiple symbols, the SDK fans out concurrent requests and merges the results. The docs also state that endpoint-specific parameters such as `from`, `to`, and `date` are passed through to the REST API.

However, the REST API page for option quotes defines those historical parameters as end-of-day:

- `date`: lookup a historical end-of-day quote from a specific trading day.
- `from` / `to`: lookup a series of end-of-day quotes.

The quote response includes `updated`, bid/ask/mid/last, bid/ask size, volume, open interest, underlying price, IV, and Greeks. The `updated` field is a timestamp for the quote snapshot, but the documented historical query modes are still daily/EOD, not intraday bars.

The SDK docs also document stock candles via `client.stocks.candles(...)`, but I did **not** find a corresponding `client.options.candles(...)` method in the SDK docs.

### Real-time / delayed snapshot nuance

The option quotes API can return current market data during market hours. MarketDataApp documents entitlement-dependent access:

- non-professional users with OPRA entitlement: real-time
- non-professional users without OPRA entitlement: 15-minute delayed
- professional or unknown entitlement: historical, 1 day old

This means the SDK may be usable for polling current option quote snapshots during the final 20 minutes of a live session, subject to OPRA entitlements and rate limits. That is different from retrieving historical intraday bars for backtesting.

## Futures candles gap

I did not find a MarketDataApp API docs section for futures, nor a documented futures candles endpoint comparable to the stock candles endpoint.

The API docs navigation currently lists:

- Stocks
- Options
- Mutual Funds
- Utilities

The docs also mention unlocked sample symbols for stock, option, index, and mutual fund endpoints. They do not mention futures endpoints or sample futures symbols.

### Practical implication

MarketDataApp appears to miss two requirements:

- historical intraday option bars/quotes for expired SPXW/NDX contracts
- historical intraday futures candles for NQ/ES/MNQ/MES

That makes it a poor fit as the primary data provider for this project unless support confirms undocumented futures coverage and undocumented historical intraday options coverage.

### Practical implication

Based on the official docs reviewed so far, MarketDataApp looks suitable for:

- expired SPX/NDX option contract lookup
- historical end-of-day option quotes
- historical end-of-day option chains
- current real-time or delayed option quote snapshots, depending on OPRA entitlement

But it does **not currently appear documented for historical intraday 1-minute or 2-minute option bars**. For testing strategies that depend on the last 20 minutes of the session, this is likely **not sufficient unless vendor support confirms an undocumented intraday options endpoint**.

## Useful endpoints

- Historical quote for a single option contract:
  `GET https://api.marketdata.app/v1/options/quotes/{optionSymbol}/?date=YYYY-MM-DD`
- Historical series for a single option contract:
  `GET https://api.marketdata.app/v1/options/quotes/{optionSymbol}/?from=YYYY-MM-DD&to=YYYY-MM-DD`
- Historical option chain for an underlying:
  `GET https://api.marketdata.app/v1/options/chain/{underlyingSymbol}/?expiration=YYYY-MM-DD`
- Historical stock/ETF candles with intraday resolutions:
  `GET https://api.marketdata.app/v1/stocks/candles/{resolution}/{symbol}/?from=YYYY-MM-DD&to=YYYY-MM-DD`
- SDK option quote:
  `client.options.quotes(optionSymbol, { date | from | to })`
- SDK stock candles:
  `client.stocks.candles(symbol, { resolution, from, to })`

## Local exploration module

This repo includes a request-budget-conscious exploration script for the SPXW contract:

```bash
npm run explore:marketdata-option
```

By default it is a dry run and spends **0 API requests**. The default target is:

- symbol: `OPRA:SPXW260702C7500.0`
- date: `2026-07-02`

The script normalizes that Polygon-style OPRA symbol to MarketData/OCC-style `SPXW260702C07500000` before calling the API.

To send the minimum live request:

```bash
MARKETDATA_TOKEN=... npm run explore:marketdata-option -- --live
```

That sends **1 request** to the option quotes endpoint with `date=2026-07-02`, which should reveal the historical end-of-day quote snapshot if the contract and entitlement are supported.

To add a tiny surrounding end-of-day window:

```bash
MARKETDATA_TOKEN=... npm run explore:marketdata-option -- --live --include-window
```

That sends **2 total requests**. It still does not ask for intraday bars, because MarketDataApp does not document historical intraday option candles.

### Live probe results

Using the provided account token, the `2026-07-02` request returned:

```json
{
  "s": "error",
  "errmsg": "Your plan can only access fully-closed sessions; the latest available is 2026-07-01."
}
```

Using the original `OPRA:SPXW260702C7500.0` symbol for `2026-07-01` returned `No option found`, which indicates MarketData expects compact OCC symbology rather than the `OPRA:` vendor prefix and decimal strike form.

Using normalized symbol `SPXW260702C07500000` for `2026-07-01` succeeded:

| Field | Value |
| --- | --- |
| `optionSymbol` | `SPXW260702C07500000` |
| `updated` | `2026-07-01 16:00:00 America/New_York` |
| `bid` / `ask` / `mid` / `last` | `12.60` / `12.90` / `12.75` / `12.84` |
| `volume` | `15640` |
| `openInterest` | `5756` |
| `underlyingPrice` | `7483.2402` |
| Greeks / IV | `null` in this response |

Requests spent during this probe: 3.

## Discord as an alternate research source

Discord has an official API for reading channel message history:

`GET /channels/{channel.id}/messages?limit=100`

Relevant constraints:

- The maximum page size is 100 messages per request.
- Pagination is done with message IDs via `before`, `after`, or `around`.
- A bot must have access to the server/channel.
- For guild channels, the bot needs `VIEW_CHANNEL`.
- Without `READ_MESSAGE_HISTORY`, the API returns no messages.
- Message content access may require Discord's message content intent, depending on the bot and server context.

This can work for exporting or indexing trading education material from a Discord channel **if the server owner/admin grants a bot access** and the group rules permit archiving.

Do not use a personal Discord user token or self-bot automation. Discord explicitly forbids automated user accounts/self-bots and warns that doing so can terminate the account.

### Practical implication for this project

Discord is not a replacement for historical OPRA/SPXW intraday market data. It could be useful for:

- collecting lessons, notes, trade explanations, and pinned resources
- indexing group discussion for later search
- extracting timestamped trade-call context, if permitted

It is not suitable as a primary source for accurate historical option bars or quote ticks.

## Databento candidate

Databento appears to be a stronger candidate for the combined market data requirement than MarketDataApp.

### OHLCV schemas

Databento documents aggregate bar schemas for:

- `ohlcv-1s`
- `ohlcv-1m`
- `ohlcv-1h`
- `ohlcv-1d`

The bars are built from trades and include:

- `ts_event`: start timestamp of the aggregation period, expressed in nanoseconds since Unix epoch
- `open`
- `high`
- `low`
- `close`
- `volume`
- `instrument_id`
- `publisher_id`

Price fields are integer fixed-point values where 1 unit equals `1e-9`.

Important behavior:

- If no trade occurs during an interval, no OHLCV record is printed.
- Non-native intervals, such as 5-minute bars, should be built from `ohlcv-1m` or from raw `trades`.
- Databento recommends constructing OHLCV bars from `trades` when transparency and exact aggregation rules matter.
- `ohlcv-1d` is based on UTC dates, so exchange-session daily bars may need to be built from more granular data.

### Fit for futures candles

Databento explicitly covers futures and lists CME Globex MDP 3.0 as a supported dataset. That is the likely dataset family for:

- ES
- MES
- NQ
- MNQ

This looks promising for historical intraday futures candles using `ohlcv-1m` or `ohlcv-1s`.

### Fit for options

Databento also documents OPRA as a supported venue/dataset and describes U.S. equity options coverage including trades, quotes, NBBO, OHLCV, and more.

Open questions to verify with a small API probe or Databento support:

- Does OPRA coverage include SPX/SPXW and NDX index options, or only equity/ETF options?
- Can we request historical `ohlcv-1m`, `trades`, `mbp-1`, `tbbo`, or `bbo` for expired SPXW contracts?
- What exact symbology should be used for `SPXW260702C07500000` or the equivalent Databento instrument?
- What is the cost for a narrow request: one SPXW contract on `2026-07-02`, last 20-30 minutes only?

### Practical implication

Databento is worth investigating next because it appears to satisfy the futures candle requirement directly and may satisfy the options requirement through OPRA, depending on index-option coverage and pricing.

Candidate first probes:

```python
client.timeseries.get_range(
    dataset="GLBX.MDP3",
    schema="ohlcv-1m",
    symbols=["ES.c.0", "NQ.c.0"],
    start="2026-07-02T19:30:00Z",
    end="2026-07-02T20:00:00Z",
)
```

```python
client.timeseries.get_range(
    dataset="OPRA.PILLAR",
    schema="ohlcv-1m",
    symbols=["SPXW260702C07500000"],
    start="2026-07-02T19:30:00Z",
    end="2026-07-02T20:00:00Z",
)
```

The OPRA example is intentionally tentative until Databento symbology and SPXW support are confirmed.

## Sources

- https://www.marketdata.app/docs/api/options/quotes/
- https://www.marketdata.app/docs/api/options/chain/
- https://www.marketdata.app/docs/api/stocks/candles/
- https://www.marketdata.app/docs/api/
- https://www.marketdata.app/api/options/how-to-use-the-option-data-api/
- https://www.marketdata.app/data/options/
- https://www.marketdata.app/docs/sdk/js/
- https://www.marketdata.app/docs/sdk/js/options/
- https://www.marketdata.app/docs/sdk/js/options/quotes/
- https://www.marketdata.app/docs/sdk/js/options/chain/
- https://github.com/MarketDataApp/sdk-js
- https://discord.com/developers/docs/resources/message#get-channel-messages
- https://support.discord.com/hc/en-us/articles/115002192352-Automated-User-Accounts-Self-Bots
- https://databento.com/docs/schemas-and-data-formats/ohlcv
- https://databento.com/docs/venues-and-datasets/cme
- https://databento.com/docs/venues-and-datasets/opra
