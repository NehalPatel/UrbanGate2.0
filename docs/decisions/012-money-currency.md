# ADR-012: Money and currency representation

**Status:** Accepted (amended 2026-07-26 — MongoDB paise integers)  
**Accepted:** 2026-07-26  
**Date:** 2026-07-26  
**Related:** Master spec §16, §29; ADR-017

## Context

Maintenance invoices and payments must be exact; floating point is unsafe. Prisma’s MongoDB connector does **not** support `Decimal`.

## Decision

- Store money as **integer paise** (`Int`) on MongoDB documents (₹1.00 → `100`)
- Never use JavaScript `number` floats for *business* math without converting through integer paise helpers
- API / UI may accept and display rupee strings (`"3500.00"`); convert at the service boundary
- Default currency: **INR**, overridable per society setting when needed

## Consequences

- Exact arithmetic via integers
- Display formatting divides by 100 at the edges
