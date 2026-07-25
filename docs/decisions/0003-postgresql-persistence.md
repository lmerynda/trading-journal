# ADR 0003: Use PostgreSQL with Drizzle-managed migrations

- Status: accepted
- Date: 2026-07-21

## Context

Daily reviews, immutable import rows, fills, grouping overrides, tags, and screenshot metadata require relational constraints and transactions. Financial values must use database decimal types rather than JavaScript floating-point persistence. The application also needs migrations that can be applied before compatible application code is deployed.

## Decision

Use PostgreSQL as the system of record and Drizzle for typed schema definitions and ordered SQL migrations.

Infrastructure code under src/backend/infrastructure/database owns Drizzle and the PostgreSQL driver. Application and domain modules depend only on repository ports and plain TypeScript DTOs. Next.js adapters never issue SQL or import the schema directly.

Migrations are committed under drizzle/, are additive by default, and run through `npm run db:migrate`. CI applies all committed migrations to an empty PostgreSQL service. Production deploys apply migrations before starting application code that requires them.

Persisted money, price, and quantity fields will use explicit decimal precision. Timestamps represent instants; a daily review separately stores its trading date and IANA time zone.

## Consequences

PostgreSQL provides transactions, uniqueness, indexing, and later full-text search in one service. Drizzle keeps SQL visible and avoids leaking persistence types into backend use cases. Local development and CI require PostgreSQL, while application tests remain fast through in-memory ports.
