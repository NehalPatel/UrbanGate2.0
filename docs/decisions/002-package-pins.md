# ADR-002: Package version pins

**Status:** Accepted  
**Accepted:** 2026-07-26  
**Date:** 2026-07-26  
**Related:** Master spec §5, §29

## Context

Exact NestJS, Next.js, Prisma, and React versions must be chosen at scaffold time after checking current stable compatibility.

## Decision

MVP-0 scaffold resolved these majors (exact patch versions in `pnpm-lock.yaml`):

| Package | Resolved (scaffold) |
|---------|---------------------|
| NestJS | 11.x |
| Next.js | 15.5.x |
| Prisma / `@prisma/client` | 6.19.x |
| React / React DOM | 19.x |
| Turborepo | 2.10.x |
| TypeScript | 5.9.x |
| pnpm | 9.15.9 (`packageManager` field) |
| Node.js | 22+ (`.nvmrc` = 22; engines `>=22`) |

The **lockfile** remains the source of truth for exact versions.

## Consequences

- No silent major upgrades without review
- Compatibility verified during MVP-0 foundation setup
