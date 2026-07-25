# ADR 0002: Use a single full-stack Next.js application

- Status: accepted
- Date: 2026-07-19

## Context

The product needs public server-rendered pages, authenticated authoring, PostgreSQL access, screenshot uploads, CSV imports, and a small amount of domain calculation. It does not currently have a mobile client, third-party API consumers, independently scaled workloads, or organizational boundaries that require separate services.

A separate React frontend and Fastify API would introduce another deployment, HTTP contracts, authentication handoff, CORS configuration, duplicated validation, and more local-development orchestration without improving the core review workflow.

## Decision

Build one full-stack Next.js application in TypeScript and deploy it as one Railway application service.

- React components render the interface.
- Server components call backend query services.
- Server actions adapt authenticated form mutations into backend commands.
- Route handlers handle multipart uploads, media delivery where necessary, and authentication callbacks.
- Framework-independent application and domain modules implement workflows, trade grouping, authorization rules, and financial calculations.
- Repository and storage ports isolate application logic from Drizzle and Railway.
- Infrastructure adapters implement those ports for PostgreSQL and Railway Storage Buckets.
- The Railway object-storage adapter is server-only.

There is no internal HTTP call between the UI and a separate backend, no general-purpose JSON CRUD API, and no Fastify service in the MVP.

## Module rule

The codebase preserves logical boundaries even though it is one deployment:

```text
React UI -> Next.js adapter -> backend command/query -> domain/ports -> infrastructure adapter
```

Client components must not import database, storage, credentials, or authentication modules. Next.js adapters must not contain business rules or query infrastructure directly. Backend application and domain modules must not depend on Next.js, React, browser APIs, Drizzle, Railway, or HTTP types.

Commands and queries accept plain TypeScript inputs and return plain DTOs or typed errors. Production composition wires them to Drizzle and Railway implementations; tests can wire them to deterministic in-memory adapters or real test infrastructure.

These boundaries make later extraction possible without paying for it today.

## Backend testing requirement

The complete backend suite must run without starting Next.js, rendering React, or launching a browser.

- Pure domain tests cover calculations and grouping.
- Application tests exercise complete use cases through ports.
- Integration tests use real PostgreSQL and S3-compatible storage while still calling application services directly.
- A small adapter-test layer verifies Next.js-specific translation.
- End-to-end browser tests verify only critical user journeys rather than carrying backend coverage.

Import restrictions and server-only modules enforce the boundary in CI.

## Consequences

### Benefits

- One application to run, test, deploy, observe, and secure.
- Public pages can read data during server rendering without an internal network request.
- Forms use normal server actions rather than maintaining a parallel API client.
- TypeScript types and validation remain local to the feature.
- Railway configuration remains small.

### Costs and limitations

- Web rendering and server-side work share one deployment and scaling unit.
- Long-running imports or image processing may eventually exceed request limits.
- A future external client will require an API boundary to be added deliberately.

## Extraction triggers

Add a separate API or worker only when at least one concrete need exists:

1. A mobile or third-party client needs a supported programmatic API.
2. CSV imports or image processing cannot reliably complete inside web requests.
3. A workload needs independent scaling, isolation, or deployment cadence.
4. Multiple applications need the same server capabilities.

When extraction is needed, reuse the existing domain functions and move repository orchestration behind the new boundary rather than rewriting business rules.
