# ADR-017: Database — MongoDB (replaces PostgreSQL)

**Status:** Accepted  
**Accepted:** 2026-07-26  
**Amended:** 2026-07-28 — portability note (Postgres remains a future option)  
**Date:** 2026-07-26  
**Related:** Master spec §5, §8, §16 (amended); ADRs 003, 006, 012, 014, 016  
**Supersedes:** PostgreSQL as the primary datastore for UrbanGate 2.0

## Context

The Phase 0 stack originally chose PostgreSQL. Product direction requires **MongoDB** for UrbanGate 2.0 and current MVP phases. Docker is not available on the current development machine and is deferred.

## Decision

- Primary database: **MongoDB** (locked for MVP-1 through Gate and beyond until a superseding ADR)
- Access layer: **Prisma** with `provider = "mongodb"`
- Tenancy: **shared database / shared collections** with `societyId` on tenant-owned documents (not database-per-tenant)
- Local/dev connection via `DATABASE_URL` (local MongoDB install or Atlas). **Docker Compose MongoDB + Redis is prepared for later**, not required to continue MVP work
- Redis remains the cache/queue store when available; optional until jobs are needed

### Future PostgreSQL portability (not active)

We **stay on MongoDB** now, but keep a clean escape hatch:

1. Domain logic lives in Nest services behind Prisma — avoid raw Mongo aggregation pipelines unless necessary
2. Money stays **integer paise** (ADR-012) so it ports to Postgres `Int` / `BigInt` without Decimal dependency
3. Tenancy stays `societyId` on rows/documents (ADR-006) — maps cleanly to SQL tables
4. Switching later requires a **new ADR superseding this one**, Prisma provider change, schema remap (ObjectId → UUID/cuid), and a data migration — not a dual-write setup during MVP

Do **not** install or run PostgreSQL for this repo until that superseding ADR is Accepted.

## Consequences

- Schema uses MongoDB ObjectId primary keys (see ADR-003 amendment)
- Uniqueness and tenancy enforced via Prisma compound unique indexes + application helpers (ADR-006)
- Backups use `mongodump` / `mongorestore` (ADR-016)
- Master spec and planner treat MongoDB as the locked datastore for MVP-1+
