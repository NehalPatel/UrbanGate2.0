# ADR-009: Frontend server-state approach

**Status:** Accepted
**Accepted:** 2026-07-26
**Date:** 2026-07-26  
**Related:** Master spec §5, §29

## Context

Three Next.js apps need consistent remote data fetching, caching, and mutation patterns against the Nest API.

## Decision

- Use **TanStack Query** for client server-state (lists, detail, polling where needed)
- Use Next.js server actions / route handlers sparingly (e.g. cookie-bound form posts), not as a second business API
- Shared typed API client / contracts live in `packages/contracts` (or equivalent) when stable
- Do not introduce additional global state libraries unless a clear UI need appears

## Consequences

- Predictable cache invalidation across admin / resident / security PWAs
- Business logic stays on the API (master §4.4)
