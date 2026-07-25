# Trade Review Library

> The strongest differentiator is not more statistics. It is a clean, chronological explanation of **context → thesis → execution → management → outcome → lesson**, backed by real fills and market data.

This is the product's driving principle. Every feature should make that explanation clearer, more accurate, or easier to revisit. Features that add activity without improving the review should be left out.

The technical architecture, data model, delivery milestones, and acceptance criteria are documented in [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md).

## Local development

Prerequisites: Node.js 24 or newer, pnpm 11, and Docker with Compose.

    cp .env.example .env
    pnpm install
    pnpm dev:all

pnpm dev:all starts PostgreSQL and the local S3-compatible object store, applies every committed migration, and starts the single Next.js application. The app is available at http://localhost:3000; the database-aware health check is at http://localhost:3000/api/health; and the object-storage console is at http://localhost:9001.

To run parts separately:

    docker compose up -d --wait
    pnpm db:migrate
    pnpm dev

The complete local verification commands are:

    pnpm check
    pnpm build

pnpm test exercises the framework-independent backend directly. It does not start Next.js, render React, or launch a browser. pnpm check:boundaries enforces the dependency direction described in [ADR 0002](./docs/decisions/0002-single-nextjs-application.md).

## Product concept

The platform is a quiet, searchable library of trading days. It brings together reviews created across trading platforms without trying to replace their charting and annotation tools.

The primary record is a **daily review**, because the trades taken on the same day share market structure, session context, and often the same thesis. A daily review contains:

- The date, instruments, account, and session context.
- A short daily thesis and final lesson.
- Usually two or three trade executions reconstructed from order fills.
- Notes and structured tags.
- Screenshots created in TradingView or another charting platform.
- A final summary connecting the day's context, decisions, outcomes, and lessons.

## Screenshot model

Each trade review should ideally contain two screenshots with distinct purposes.

### 1. Entry-context screenshot

Captured at, or reconstructed to represent, the moment the trade was taken. It shows only the information that was available to the trader at decision time.

Its purpose is to create a reusable visual reference for recognizing the setup in the future without the benefit of hindsight.

Suggested supporting fields:

- What was visible?
- What was the thesis?
- What triggered the entry?
- What would invalidate the idea?
- What was the intended management plan?

### 2. Outcome screenshot

Captured after the trade or session has developed. Hindsight is intentionally useful here.

Its purpose is to evaluate execution and management: whether the entry was early or late, whether the exit followed the thesis, whether the trade was held long enough, and what the market ultimately did.

Suggested supporting fields:

- What actually happened?
- How was the trade managed?
- Why was the position exited?
- Which execution errors are visible in hindsight?
- What should be repeated or changed next time?

The two screenshots must remain visibly labeled. The outcome image should never overwrite or masquerade as the information available at entry.

## Core hierarchy

```text
Library
└── Daily review
    ├── Shared market and session context
    ├── Trade 1
    │   ├── Order fills and calculated statistics
    │   ├── Entry-context screenshot
    │   ├── Outcome screenshot
    │   ├── Thesis, management, outcome, and lesson
    │   └── Tags
    ├── Trade 2
    ├── Trade 3
    └── Daily summary
```

## Initial scope

- Create and browse daily reviews.
- Upload order fills and group them into trades within a day.
- Correct, split, or merge automatically grouped executions.
- Upload and label entry-context and outcome screenshots.
- Record structured review notes and tags.
- Calculate a restrained set of execution statistics from fills.
- Write a final daily summary across all trades.
- Search and filter the public library.
- Give every daily review and individual trade a stable web page that people and external AI tools can browse by URL.

## Explicitly out of scope initially

- Reimplementing TradingView or building an interactive charting system.
- Drawing and annotation tools.
- Real-time market-data visualization.
- A large dashboard of loosely useful metrics.
- Automated broker integrations before CSV ingestion is dependable.
- Social feeds, leaderboards, or engagement mechanics.

Historical market context can initially be preserved in uploaded screenshots. Market-data integrations may later support validation and additional statistics, but they are not required for the core review experience.

## Product test

Before adding a feature, ask:

> Does this help explain the context, thesis, execution, management, outcome, or lesson of a trading day?

If not, it probably does not belong in the core product.

## AI access principle

No separate AI workflow is required. Shared daily-review and trade pages should use clear, semantic HTML, include the written review and full-resolution screenshots, and have stable URLs. The user can give those ordinary links to an external AI just as they would give them to another person.
