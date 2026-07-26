# ADR-005: Tenant resolution strategy

**Status:** Accepted
**Accepted:** 2026-07-26
**Date:** 2026-07-26  
**Related:** Master spec §8, §25 Rule 4, §29

## Context

Every tenant-owned operation must resolve society context securely. Client-supplied IDs must never be proof of access.

## Decision

1. Authenticate the user first
2. Resolve **active society** from server-side session / membership context (society switcher updates this)
3. Optional request header `X-Society-Id` is only a **switch hint**: accepted only after verifying an active `SocietyMembership` for that user
4. Platform-admin paths use explicit privileged routes; they do not reuse society APIs without elevation
5. Cross-tenant reads/writes must be impossible through normal society APIs

Do **not** use subdomain-per-tenant as a hard requirement for MVP (may be added later for branding).

## Consequences

- Tenant context is central and testable
- UI society pickers cannot bypass authorization
- Multi-society users get a clear switcher model
