# ADR-008: Email provider abstraction

**Status:** Accepted
**Accepted:** 2026-07-26
**Date:** 2026-07-26  
**Related:** Master spec §5, §11.22, §29

## Context

Auth, invites, and notices need email without coupling domain code to a single vendor.

## Decision

- Define an `EmailService` interface (send templated / transactional mail)
- **Development:** console logger and/or Ethereal (or similar catcher)
- **Production:** choose provider via env (e.g. Resend, SES, SMTP) — pick concrete vendor when first production deploy is planned
- SMS / WhatsApp remain out of MVP

## Consequences

- Templates and copy live with the app; transport is swappable
- No production email provider cost required to start MVP-0
