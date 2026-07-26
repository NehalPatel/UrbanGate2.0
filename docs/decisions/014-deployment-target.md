# ADR-014: Deployment target

**Status:** Accepted (amended 2026-07-26 — MongoDB; Docker deferred)  
**Accepted:** 2026-07-26  
**Date:** 2026-07-26  
**Related:** Master spec §5, §22, §29; ADR-017

## Context

MVP needs a simple, operable deploy path without Kubernetes complexity. Docker is not installed on the current development workstation and is deferred.

## Decision

- **Dev (now):** Run API and Next apps locally; connect to MongoDB via local install or Atlas using `DATABASE_URL`. Redis optional until queues are required
- **Later / prod path:** Docker Compose on a VPS (API, web or reverse proxy, **MongoDB**, Redis, optional MinIO) — `docker-compose.yml` is maintained for that day
- **Not for MVP:** Kubernetes, multi-region active-active, or managed serverless-first rewrites

## Consequences

- Foundation and MVP-1+ can proceed without Docker
- Compose remains the eventual self-host contract
