# ADR-004: Authentication / session strategy

**Status:** Accepted
**Accepted:** 2026-07-26
**Date:** 2026-07-26  
**Related:** Master spec §9, §29

## Context

Web apps (admin, resident, security) need secure session handling. Native mobile may need Bearer tokens later.

## Decision

**Web (MVP):**

- Email / password authentication
- Password hashing: **Argon2id**
- Session: **HTTP-only, Secure, SameSite** cookies
- Short-lived access cookie + longer-lived **refresh token with rotation**
- Logout invalidates server-side session / refresh token
- Forgot / reset password flows; account statuses: active, invited, suspended, disabled
- Rate limiting on auth endpoints

**Later (native apps):**

- Optional Bearer JWT (or opaque token) using the same identity store — not required for PWA MVP

**Out of scope for MVP:** Google, Apple, MFA/passkeys, mobile OTP (architecture may leave hooks)

## Consequences

- Cookie auth fits Next.js same-site / reverse-proxy deployments
- CSRF protections must match cookie strategy (SameSite + explicit CSRF where needed)
- No Auth0/Clerk required for MVP
