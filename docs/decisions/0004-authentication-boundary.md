# ADR 0004: Keep authentication at the Next.js adapter boundary

- Status: accepted
- Date: 2026-07-21

## Context

Reading the library is public, while every authoring, import, upload, and deletion operation requires an administrator identity. Authentication mechanics are framework- and provider-specific, but authorization is an application rule and must remain testable without Next.js.

## Decision

Next.js authentication adapters will establish secure, HTTP-only, same-site sessions and translate the session into a plain administrator identity. Server actions and route handlers must require that identity before invoking a write use case.

Backend application services receive identity values through plain inputs or identity ports. They do not import cookies, Next.js request types, React, or a provider SDK. Authorization decisions that affect business data remain in application services and are tested with deterministic identities.

Public queries require no session and expose review-facing DTOs only. Authentication endpoints are rate limited, secrets stay server-only, and session identifiers are rotated after authentication and privilege changes.

The credential provider and login ceremony are deliberately selected at the start of Milestone 1. That choice may change the adapter, but it may not weaken this boundary or the session policy.

## Consequences

Backend write authorization can be tested without an HTTP server. Provider replacement does not rewrite domain workflows. The application must maintain thin authentication adapters and cannot rely on UI visibility as access control.
