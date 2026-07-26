# ADR-001: Node.js version

**Status:** Accepted
**Accepted:** 2026-07-26
**Date:** 2026-07-26  
**Related:** Master spec §29

## Context

The monorepo needs a pinned Node.js version for local development, Docker images, and CI.

## Decision

Use **Node.js 22 LTS**.

- Pin via `.nvmrc` / `.node-version` and `engines` in the root `package.json`
- Align Docker base images and GitHub Actions `node-version` with the same major

## Consequences

- Developers use Node 22 locally
- Upgrade to the next LTS is a deliberate ADR update, not an ad-hoc bump
