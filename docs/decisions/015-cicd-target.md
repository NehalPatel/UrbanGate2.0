# ADR-015: CI/CD target

**Status:** Accepted
**Accepted:** 2026-07-26
**Date:** 2026-07-26  
**Related:** Master spec §5, §23, §28, §29

## Context

Every PR should prove install, quality gates, and tests before merge.

## Decision

- **CI:** GitHub Actions on pull requests and main
- Pipeline steps: `pnpm install`, lint, typecheck, unit/integration tests
- Deploy CD can remain manual (`docker compose` on the server) until a society goes live; automate later under a new ADR

## Consequences

- Matches existing GitHub hosting of legacy UrbanGate repos
- No mandatory cloud deploy vendor for MVP-0
