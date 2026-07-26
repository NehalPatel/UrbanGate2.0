# ADR-013: Date and time conventions

**Status:** Accepted
**Accepted:** 2026-07-26
**Date:** 2026-07-26  
**Related:** Master spec §16, §19, §29

## Context

Societies operate in local time zones; billing periods are date-based; servers should not mix conventions.

## Decision

- Persist timestamps in **UTC**
- Each society has a configured **time zone** and locale for display and billing cutoffs
- Billing periods and “calendar dates” use explicit **date-only** fields (not midnight local guessed as UTC)
- APIs return ISO-8601 timestamps; clients convert for display using society TZ where relevant

## Consequences

- Avoids DST and “off-by-one day” billing bugs
- Job schedulers should reason in society TZ when generating bills
