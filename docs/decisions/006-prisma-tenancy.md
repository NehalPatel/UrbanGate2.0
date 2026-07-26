# ADR-006: Prisma tenancy enforcement

**Status:** Accepted (amended 2026-07-26 — MongoDB)  
**Accepted:** 2026-07-26  
**Date:** 2026-07-26  
**Related:** Master spec §8, §25 Rules 4–6, §29; ADR-017

## Context

Shared MongoDB with `societyId` on tenant-owned documents needs consistent enforcement in application code and indexes.

## Decision

- Most tenant-owned models include `societyId` (Prisma field; stored on documents)
- Unique constraints that are tenant-local are compound indexes including `societyId`
- **Central tenant context** + repository/service helpers that always inject `societyId` into queries and writes
- Controllers remain thin; they do not assemble unscoped Prisma queries
- **Do not** rely on Prisma middleware as the sole enforcement mechanism (helpers + reviews + tests are primary)
- Automated **integration tests** must prove Society A cannot read/write Society B data
- Prefer application-level invariants where MongoDB cannot express relational FK constraints

## Consequences

- Slightly more boilerplate in data access; much safer tenancy
- Indexes + helpers backstop mistakes (MongoDB has no SQL FK equivalent)
