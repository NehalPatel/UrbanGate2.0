# ADR-007: Object storage abstraction

**Status:** Accepted
**Accepted:** 2026-07-26
**Date:** 2026-07-26  
**Related:** Master spec §5, §29

## Context

Uploads (logos, attachments, invoice PDFs) need a storage backend that can change between environments without rewriting domain code.

## Decision

- Define a `StorageService` interface (put, get, delete, signed URL where needed)
- **Development:** local filesystem (volume-mounted in Docker)
- **Production interface:** S3-compatible API
- Optional MinIO in Docker Compose for local S3 parity — not required on day one

## Consequences

- Domain modules depend on the abstraction, not AWS/MinIO SDKs directly
- Secrets and bucket names come from environment configuration
