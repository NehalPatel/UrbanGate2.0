# ADR-011: Audit log format

**Status:** Accepted
**Accepted:** 2026-07-26
**Date:** 2026-07-26  
**Related:** Master spec §11.23, §25 Rule 8, §29

## Context

Financial, identity, access, visitor, and administrative operations require durable audit trails.

## Decision

Append-only `AuditLog` rows with at least:

| Field | Notes |
|-------|--------|
| `id` | UUID |
| `actorUserId` | Nullable for system jobs |
| `societyId` | Nullable for platform-only actions |
| `action` | Stable string, e.g. `invoice.issue` |
| `entityType` | e.g. `Invoice` |
| `entityId` | UUID string |
| `before` | JSON, redacted; optional |
| `after` | JSON, redacted; optional |
| `correlationId` | Request / job id |
| `ip` | Optional |
| `userAgent` | Optional |
| `createdAt` | UTC |

Never store passwords, tokens, OTPs, or full payment secrets in audit payloads.

## Consequences

- Audits are queryable per society and entity
- Prefer status/reversal over deleting audited financial history
