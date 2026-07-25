# Implementation Plan

## 1. Objective

Build a public trade-review library organized by trading day. Each day combines shared market context, a small number of trades, normalized order fills, two intentionally different screenshot perspectives, structured notes, tags, and a final daily lesson.

The application will not implement charting or drawing tools. TradingView and other trading platforms remain the place where charts are prepared and annotated; this platform preserves, organizes, and connects those reviews to actual executions.

## 2. Product invariants

These rules should survive changes in framework, design, and scope:

1. The daily review is the primary record. Trades belong to a trading day and share its context.
2. Raw imported fills are immutable. Corrections affect grouping or normalized metadata, not the source record.
3. Entry-context and outcome screenshots have different meanings and must always be labeled.
4. Entry-context material must not be silently replaced by hindsight material.
5. Calculated facts and human judgment remain distinguishable.
6. Reading is public by default; authentication protects authoring and administration, not review access.
7. A statistic is shown only when its inputs and meaning are reliable.
8. The product does not attempt to replace TradingView or broker platforms.
9. Every shared day and trade has a stable, content-complete web URL that people and external AI tools can browse without a special integration.

## 3. Recommended architecture

Use one full-stack Next.js application written in TypeScript. It is one repository, one package, and one Railway application service rather than separate frontend and backend deployments.

```text
src/
  app/                 Next.js routes, layouts, server actions, route handlers
    (public)/           Public library, daily review, and trade pages
    admin/              Authenticated authoring screens
  components/          React UI components
  backend/
    application/        Framework-independent commands, queries, and DTOs
    domain/             Pure grouping and financial calculation logic
    ports/              Repository, storage, clock, and identity interfaces
    infrastructure/
      auth/             Administrator sessions and identity adapter
      database/         Drizzle schema, migrations, and repositories
      storage/          Railway S3-compatible object adapter
      imports/          CSV parsing adapters
    composition/        Production and test dependency wiring
  lib/                  Shared validation and presentation helpers
tests/                  Integration and end-to-end fixtures
```

### Application

- **Next.js with React and TypeScript** provides both UI rendering and server-side application code.
- Server-render the public library, day, and trade pages; use client components only for editing, uploading, filtering, and other interactions.
- Server components call backend query services directly for page reads; they do not call repositories or an internal HTTP API.
- Server actions adapt ordinary form mutations into backend commands such as creating reviews, editing notes, changing tags, and correcting grouped trades.
- Next.js route handlers are reserved for boundaries that need HTTP semantics, primarily multipart screenshot uploads, image delivery, and authentication callbacks.
- Use accessible headless primitives and a small token-based design system rather than a large component catalog.
- Use Zod at each server boundary so form and upload inputs are validated before reaching repositories or domain functions.
- Present screenshot upload as an ordinary file picker, paste, or drag-and-drop action.

### Internal boundaries

- `src/app` and `src/components` form the frontend/adaptation side. They may depend on backend application commands, queries, and DTOs but never on database or storage implementations.
- `src/backend/application`, `domain`, and `ports` are independent of React, Next.js, browser APIs, Drizzle, Railway, and HTTP request/response types.
- Database, storage, authentication, and import implementations are server-only and must never be imported into client components.
- Server actions, server components, and route handlers are thin adapters. They validate transport input, obtain the administrator identity when required, call one backend use case, and translate the result for the UI.
- Business rules, transaction decisions, authorization rules, grouping, calculations, and persistence orchestration belong in the backend application/domain layers, not in Next.js adapters.
- Backend application services accept plain TypeScript inputs and return plain DTOs or typed errors.
- Do not build a CRUD JSON API, OpenAPI specification, shared API client, Fastify service, or separate backend deployment for the MVP.
- If a mobile client, third-party integration, or genuinely independent service appears later, expose the existing server/domain functions through an API at that point.
- Keep short work inside the Next.js server process. Add a small worker or Railway cron service only when a measured task cannot safely complete within a request.
- Do not introduce Redis initially.

Enforce the boundary with server-only entry modules, ESLint restricted-import rules, and tests that import the backend application layer without loading Next.js or React.

### Backend testability

The complete backend behavior must be testable without rendering frontend components, launching a browser, or starting a Next.js HTTP server.

- Domain tests call pure grouping and calculation functions.
- Application tests call commands and queries with in-memory or deterministic test ports.
- Integration tests call the same commands and queries with real PostgreSQL repositories and an S3-compatible test storage service.
- Adapter tests cover the thin server-action and route-handler translation only where framework behavior matters.
- End-to-end browser tests remain a small separate layer for the critical user journeys.

No business rule is considered covered only because a component or browser test happens to exercise it.

### Persistence

- **PostgreSQL** is the system of record.
- **Drizzle ORM** provides typed SQL, schema definitions, and migrations while keeping database behavior visible.
- **Railway Storage Buckets** hold original screenshots and generated display variants for the initial deployment.
- PostgreSQL stores opaque object keys, review associations, roles, dimensions, byte sizes, hashes, and other metadata; image binaries are never stored in database rows.
- The Next.js upload route accepts ordinary multipart uploads, validates them, writes them to Railway, and records the resulting object key in the same operation.
- Presigned direct transfers are an optional later optimization if file volume or API bandwidth makes them worthwhile; they are not required for the initial product.
- Storage access is isolated behind a small S3-compatible adapter. Application and domain code must not store Railway-specific URLs or depend on Railway APIs.
- The production bucket can remain private as an implementation safeguard against listing and arbitrary object access, while application image URLs are publicly readable. The delivery mechanism can change without affecting the review model.

The full decision and migration boundary are documented in [ADR 0001](./docs/decisions/0001-screenshot-storage.md).

### Local development

- A single npm package.
- Docker Compose for PostgreSQL and an S3-compatible local object store.
- One command starts infrastructure, migrations, and the Next.js application.
- Committed seed data should contain a realistic daily review with three trades, fills, and both screenshot roles.

The single-application decision and extraction triggers are documented in [ADR 0002](./docs/decisions/0002-single-nextjs-application.md).

## 4. Domain model

### Administration

#### AdminUser

- `id`
- `email`
- `displayName`
- `defaultTimeZone`
- timestamps

#### TradingAccount

- `id`
- `name`
- `brokerOrPlatform`
- optional external account reference, encrypted or redacted where appropriate
- `currency`
- `archivedAt`

Authentication should use secure HTTP-only sessions. Read endpoints are public; create, update, upload, import, and delete operations require an authenticated administrator.

### Daily review

#### DailyReview

- `id`
- `tradingDate`: the user's market/session date, not a UTC-derived calendar date
- `timeZone`
- optional `title`
- `sessionContext`
- `dailyThesis`
- `dailySummary`
- `status`: `draft | complete`
- stable public `slug`
- `createdAt`, `updatedAt`

Both draft and complete statuses are publicly readable; status communicates review completeness rather than access control.

The initial uniqueness rule should be one daily review per trading date. If later workflows require separate sessions, add session sections inside the day before allowing duplicate daily records.

### Trades and executions

#### Instrument

- `id`
- normalized `symbol`
- `assetClass`
- optional exchange
- tick size, tick value, contract multiplier, and currency
- aliases used by individual import sources

#### Execution

- `id`, `tradingAccountId`, nullable `tradeId`
- `source`
- external execution/order identifiers when provided
- instrument
- `side`: `buy | sell`
- decimal `quantity`, `price`, `fees`
- `executedAt`
- immutable normalized payload
- reference to its import row

Use decimal database types for money, price, and quantity. Do not use JavaScript floating-point arithmetic for persisted financial calculations.

#### Trade

- `id`, `dailyReviewId`, `tradingAccountId`, `instrumentId`
- sequence within the day
- `side`: `long | short`
- `openedAt`, `closedAt`
- structured review fields:
  - `thesis`
  - `entryTrigger`
  - `invalidation`
  - `managementPlan`
  - `actualManagement`
  - `exitReason`
  - `outcome`
  - `lesson`
- derived execution facts:
  - entry and exit quantity
  - volume-weighted average entry and exit
  - gross P&L, fees, and net P&L
  - holding duration
- optional planned risk fields for calculating R-multiple
- derivation version and calculation timestamp

Derived fields can be cached for reads, but the domain calculator must be able to reproduce them from executions and instrument specifications.

### Screenshots

#### TradeImage

- `id`, `tradeId`
- `role`: `entry_context | outcome | supporting`
- object storage key
- original filename, MIME type, byte size, width, and height
- optional caption
- `capturedAt` when known
- display order
- `createdAt`

Allow several images if necessary, but support exactly one **primary** entry-context image and one **primary** outcome image. Replacing a primary changes which image is featured; it should not destroy the previous upload automatically.

The UI must visually name the roles rather than communicating them through position alone.

### Tags

#### Tag and TradeTag

Tags belong to the library and a controlled family:

- `setup`
- `context`
- `execution`
- `psychology`

Daily tags can be added later if trade tags do not cover the real workflow. Do not begin with parallel tag systems.

### Imports

#### ImportProfile

- saved column mapping for a broker/platform export
- timestamp parsing rules and time zone
- default account
- instrument alias rules

#### ImportBatch

- `id`, source file metadata
- status and row counts
- mapping profile/version
- error summary
- created and completed timestamps

#### ImportRow

- `importBatchId`, row number
- immutable raw row as JSON
- parse status and error
- nullable resulting execution ID

This provides an audit trail and makes importer bugs repairable without asking the user to find the original CSV again.

## 5. Trade grouping and calculations

Implement grouping in `packages/domain` with fixture-based tests.

### Initial grouping algorithm

1. Partition executions by user, trading account, and normalized instrument.
2. Sort by execution timestamp, then stable source row order.
3. Track signed position quantity.
4. Start a trade when position moves from zero to non-zero.
5. Scaling in and partial exits remain in the same trade.
6. Close a trade when position returns to zero.
7. A reversal closes the original trade at zero and starts a new trade for the remaining quantity.
8. Place open positions in an incomplete trade and label them clearly.
9. Assign each trade to the trading date using the review time zone and configured session boundary.

The review screen must allow the user to split, merge, move, or reorder trades. Store explicit grouping overrides, then rerun calculations deterministically.

### Reliable MVP statistics

- Side and total quantity.
- Average entry and exit.
- Gross P&L.
- Fees and net P&L.
- Open, close, and holding time.
- Planned risk and R-multiple when the user supplies a valid stop/risk amount.
- Daily totals and cumulative realized P&L across the day's closed trades.

Do not claim intra-trade MFE, MAE, or live drawdown from fills alone. Those require market prices or a live marked-position stream and belong to a later market-data milestone. Realized drawdown across closed executions is a different metric and must be named accordingly.

## 6. Main user journeys

### Create a daily review

1. Select or create the trading date.
2. Enter shared session context and daily thesis.
3. Import fills or add a trade manually.
4. Review automatic grouping and correct it if necessary.
5. Complete each trade's chronological review.
6. Upload and label entry-context and outcome screenshots.
7. Add restrained structured tags.
8. Write the final daily summary.
9. Mark the review complete when the narrative is finished.

### Read the public library

- Default to a chronological list of days rather than a metric dashboard.
- Each day preview shows date, instruments, trade count, net result, a primary lesson, and review completeness.
- Filter by date, instrument, direction, tag, setup, and outcome.
- Full-text search should cover the narrative fields after the core workflow is stable.

### Read a daily review

- Begin with shared daily context.
- Show trades in execution order.
- Within each trade, present entry-context first, followed by execution facts, management, outcome image, and lesson.
- Keep raw execution rows collapsed by default.
- End with the daily summary so the page reads chronologically.

### Share a review or trade

- Every saved daily review has a stable public URL.
- Every trade has a stable URL within its daily review.
- Public pages do not require an account.
- Internal broker identifiers, credentials, storage keys, and administration metadata are never part of the public response, but review content itself does not have a separate privacy or publishing state.
- Keep both day and trade pages server-rendered, semantically structured, and content-complete so an external AI can browse the ordinary URL.

## 7. Application boundaries

Public pages are ordinary Next.js routes:

```text
/
/days/:slug
/days/:slug/trades/:tradeId
```

Authenticated authoring uses pages under `/admin` and server actions colocated with their feature. The application does not expose a general-purpose JSON CRUD API.

Route handlers are limited to:

```text
/api/auth/*                 Authentication callbacks/session operations
/api/trades/:id/images     Multipart screenshot upload
/media/:imageId            Public image delivery when object URLs are not used
```

Important behavior:

- Server actions and route handlers enforce administrator authentication for every mutation.
- Retryable imports and uploads use idempotency keys where duplication is possible.
- Public page queries select only review-facing fields and never serialize infrastructure secrets or administration metadata.
- Concurrency-sensitive edits use an `updatedAt` or version precondition to avoid silent overwrites.
- After successful writes, server actions revalidate only the affected public and admin routes.
- Next.js adapters contain no SQL, Drizzle queries, object-storage calls, trade calculations, or multi-step workflow decisions.

## 8. Frontend information architecture

```text
/                              Public daily library
/days/:slug                    Public daily review
/days/:slug/trades/:tradeId    Public trade within the daily review
/admin/days/new                Start or import a daily review
/admin/days/:id/edit           Edit context, trades, images, and summary
/admin/imports/:id             Map, validate, and commit a CSV import
/admin/settings/accounts       Trading accounts and import profiles
/admin/settings/tags           Controlled tag vocabulary
```

### Daily review editor

Use one calm vertical narrative rather than a multi-panel trading terminal:

1. Day context.
2. Repeated trade sections.
3. Entry-context image.
4. Thesis and planned management.
5. Compact execution facts.
6. Actual management and exit.
7. Outcome image.
8. Lesson and tags.
9. Daily summary.

Autosave text after a short idle interval and display a small, honest save state. Image uploading and fill importing require explicit progress and recoverable error states.

## 9. Delivery milestones

### Milestone 0 — Repository foundation

Deliver:

- Single-package Next.js TypeScript application.
- Application health check covering the server and database connection.
- PostgreSQL and object-storage development services.
- Database migrations, linting, formatting, type checking, and test commands.
- CI running static checks and tests.
- Architecture decision records for application boundaries, persistence, authentication, and file storage.

Acceptance criteria:

- A new developer can start the system from documented commands.
- Client components cannot import server-only database, storage, or authentication modules.
- The entire backend test suite runs without starting Next.js or rendering React.
- A boundary check fails CI when frontend code imports backend infrastructure directly or backend application/domain code imports Next.js or React.
- A migration can be applied to an empty database and rolled forward in CI.

### Milestone 1 — Daily review and screenshot vertical slice

Deliver:

- Administrator authentication for write operations.
- Public daily library and authenticated daily-review CRUD.
- Manual trade creation and ordering.
- Structured trade-review fields.
- Direct image upload, metadata validation, and thumbnails.
- Primary entry-context and outcome image roles.
- Draft/completed review state.

Acceptance criteria:

- A user can create a day with three trades and review it end to end.
- Each trade clearly distinguishes the two screenshot perspectives.
- Refreshing or signing in again preserves the complete review.
- Unauthenticated visitors can read reviews but cannot create, edit, upload, import, or delete anything.

### Milestone 2 — Fill ingestion and derived execution facts

Deliver:

- CSV upload and preview.
- Reusable mapping profiles.
- Immutable import rows and normalized executions.
- Instrument alias/specification management.
- Deterministic trade grouping.
- Split, merge, move, and reorder corrections.
- Reliable MVP statistics.

Acceptance criteria:

- Reimporting the same source does not duplicate executions.
- Scaling, partial exits, reversals, fees, and open positions pass fixture tests.
- Every displayed number traces back to executions and an explicit instrument specification.
- Failed rows are visible and do not prevent valid rows from being reviewed.

### Milestone 3 — Public reading and sharing polish

Deliver:

- Stable public day and trade routes.
- Server-rendered daily reviews optimized for screenshots and narrative reading.
- Stable links to individual trades within a daily review.
- Social metadata and sensible image previews.

Acceptance criteria:

- Infrastructure secrets and internal administration fields never appear in public payloads or page source.
- Public pages work without an account and remain readable on mobile.
- An external browser, including an AI browsing tool, can read the day or trade URL and access the review text and screenshots without a special API or export.

### Milestone 4 — Library retrieval and daily summaries

Deliver:

- Filters for date, instrument, side, tags, setup, and review status.
- Full-text search across review narratives.
- Daily totals and restrained period summaries.
- Review-completeness cues based on missing context, screenshots, or lessons.

Acceptance criteria:

- The user can find a historical setup from remembered text or tags.
- Summary calculations use the same tested domain functions as individual reviews.
- The library remains day-first and does not turn into a dashboard of decorative metrics.

### Milestone 5 — Live drawdown and market-data extension

This is intentionally outside the first release.

Potential deliverables:

- Broker/platform connector interface.
- Live position and mark-price event ingestion.
- Append-only position-equity samples.
- Intra-trade drawdown, MFE, and MAE with provenance labels.
- Optional historical-data provider adapters for validation, not chart rendering.

Before beginning, decide which platforms and asset classes matter. Exact drawdown semantics must specify mark source, sampling frequency, commissions, slippage, and treatment of partial positions.

## 10. Quality strategy

### Automated tests

- **Unit tests:** trade grouping, signed positions, P&L, fees, session dates, and public serialization rules.
- **Backend application tests:** commands and queries, write authorization, idempotency, upload rollback/cleanup, and public read rules without Next.js or React.
- **Backend integration tests:** uniqueness, imports, grouping overrides, review status transitions, PostgreSQL repositories, and S3-compatible storage through application services.
- **Next.js adapter tests:** transport validation, identity extraction, redirects, cache revalidation, and mapping typed backend errors to UI responses.
- **Component tests:** screenshot-role labeling, editor states, and destructive confirmations.
- **End-to-end tests:** create day, upload both images, import fills, correct grouping, complete review, and open its public day and trade URLs without authentication.

Keep anonymized CSV fixtures for every supported platform. Import adapters are not complete until their fixtures include partial fills, fees, duplicate rows, reversals, malformed timestamps, and daylight-saving boundaries.

### Operational requirements

- Structured request and background-task logs with correlation IDs.
- Error tracking for the Next.js application and any future background process.
- Database backups and object-storage lifecycle policy.
- Image size and MIME restrictions, malware-safe handling, and metadata stripping where practical.
- Rate limits on authentication, uploads, imports, and public endpoints.
- Database migrations are additive and deployable before application code that depends on them.

## 11. Deferred decisions

Resolve these before the affected milestone, not before repository setup:

1. First CSV platforms to support.
2. Futures-only MVP versus multiple asset classes.
3. Session boundary rules for overnight futures trading.
4. Whether one user can have several trading accounts in a single daily review.
5. Authentication provider versus self-hosted email login.
6. Long-term backup destination and recovery policy for screenshot originals.
7. Whether AI-assisted summaries are useful after the manual review workflow has real usage data.

## 12. MVP definition of done

The first release is successful when one user can reliably:

1. Import fills from the platforms they actually use.
2. Review and correct two or three grouped trades for a trading day.
3. Upload a clearly labeled entry-context and outcome screenshot for each trade.
4. Explain context, thesis, execution, management, outcome, and lesson.
5. Complete a final daily summary.
6. Find the review later by date, instrument, text, or tag.
7. Share the ordinary public day or trade URL without a publishing step.
8. Give an external AI an ordinary public day or trade URL that contains the full review and screenshots.

Anything not required for that loop should be evaluated after the loop is in regular use.
