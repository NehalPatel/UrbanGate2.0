# ADR-017: Database — MongoDB (replaces PostgreSQL)

**Status:** Accepted  
**Accepted:** 2026-07-26  
**Date:** 2026-07-26  
**Related:** Master spec §5, §8, §16 (amended); ADRs 003, 006, 012, 014, 016  
**Supersedes:** PostgreSQL as the primary datastore for UrbanGate 2.0

## Context

The Phase 0 stack originally chose PostgreSQL. Product direction now requires **MongoDB** for UrbanGate 2.0 and all subsequent MVP phases. Docker is not available on the current development machine and is deferred.

## Decision

- Primary database: **MongoDB**
- Access layer: **Prisma** with `provider = "mongodb"`
- Tenancy: **shared database / shared collections** with `societyId` on tenant-owned documents (not database-per-tenant)
- Local/dev connection via `DATABASE_URL` (local MongoDB install or Atlas). **Docker Compose MongoDB + Redis is prepared for later**, not required to continue MVP work
- Redis remains the cache/queue store when available; optional until jobs are needed

## Consequences

- Schema uses MongoDB ObjectId primary keys (see ADR-003 amendment)
- Uniqueness and tenancy enforced via Prisma compound unique indexes + application helpers (ADR-006)
- Backups use `mongodump` / `mongorestore` (ADR-016)
- Master spec and planner treat MongoDB as the locked datastore for MVP-1+
