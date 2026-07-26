# ADR-016: Backup and restore strategy

**Status:** Accepted (amended 2026-07-26 — MongoDB)  
**Accepted:** 2026-07-26  
**Date:** 2026-07-26  
**Related:** Master spec §17, §29; ADR-017

## Context

Tenant financial and membership data requires recoverable backups before production use.

## Decision

**MVP documentation + manual ops:**

1. MongoDB: scheduled `mongodump` to durable storage; restore with `mongorestore`
2. Object storage: versioning or periodic sync of the bucket / filesystem volume
3. Secrets: never store in dump docs; restore runbooks exclude committing `.env`
4. Test restore at least once before first real society goes live

**Later:** automated scheduled backups, retention policy, and restore drills (new ADR). Atlas continuous backup is acceptable when using Atlas.

## Consequences

- Production launch requires a written restore checklist, not only dumps “somewhere”
- RPO/RTO targets can be tightened after first production society
