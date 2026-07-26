# ADR-010: API error schema

**Status:** Accepted
**Accepted:** 2026-07-26
**Date:** 2026-07-26  
**Related:** Master spec §15, §29

## Context

Clients need a stable error envelope; production must not leak stack traces.

## Decision

API base path: `/api/v1`

Error response body:

```json
{
  "error": {
    "code": "STRING_MACHINE_CODE",
    "message": "Human-readable summary",
    "details": null,
    "correlationId": "uuid-or-request-id"
  }
}
```

- `details` may be a structured object/array for validation failures; omit or null otherwise
- Always include `correlationId` aligned with request logging
- No stack traces or internal SQL in production responses
- Success payloads remain resource-oriented JSON; pagination/filter/sort conventions follow master §15

## Consequences

- Frontends map `code` to UX; support uses `correlationId`
- OpenAPI documents the envelope once and reuses it
