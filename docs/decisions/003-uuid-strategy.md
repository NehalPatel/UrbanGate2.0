# ADR-003: Document ID strategy

**Status:** Accepted (amended 2026-07-26 — MongoDB)  
**Accepted:** 2026-07-26  
**Date:** 2026-07-26  
**Related:** Master spec §16, §29; ADR-017

## Context

Entity primary keys must be stable, opaque, and safe for distributed generation. UrbanGate 2.0 uses MongoDB (ADR-017).

## Decision

- Default primary keys: MongoDB **ObjectId** via Prisma `@id @default(auto()) @map("_id") @db.ObjectId`
- Foreign keys / relation fields that reference documents use `String` + `@db.ObjectId` where applicable
- Do not use auto-increment integers for public or cross-service identifiers
- UUIDv7/v4 strings may still be used for **non-document** opaque tokens (e.g. correlation IDs, session ids) — not as MongoDB `_id` defaults

## Consequences

- APIs expose ObjectId strings; clients never invent IDs as proof of ownership
- Tenancy scoping uses `societyId` fields, not ID encoding
