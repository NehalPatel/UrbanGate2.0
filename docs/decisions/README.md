# Architecture Decision Records

Phase 0 decisions required by [URBANGATE-2-MASTER-SPEC.md](../URBANGATE-2-MASTER-SPEC.md) §29.

| Status | Meaning |
|--------|---------|
| **Proposed** | Recommended default; awaiting product owner confirmation |
| **Accepted** | Locked for implementation |
| **Superseded** | Replaced by a newer ADR |

**Gate A passed (2026-07-26):** Phase 0 ADRs Accepted.  
**2026-07-26 amendment:** [ADR-017](./017-mongodb.md) locks **MongoDB** (replaces PostgreSQL). Docker Compose deferred until Docker is available.

**Implementation progress (2026-07-27):** No new ADRs. Work follows the locked decisions below. See [PROJECT-PLANNER.md](../PROJECT-PLANNER.md).

| Gate / MVP | Status | Notes tied to ADRs |
|------------|--------|--------------------|
| Gate B (MVP-0 foundation) | Passed | NestJS + Next.js monorepo, Prisma MongoDB, health, CI |
| MVP-1 Identity & tenant | Done | Cookie sessions ([004](./004-auth-session.md)), `societyId` tenancy ([005](./005-tenant-resolution.md), [006](./006-prisma-tenancy.md)), ObjectId ([003](./003-uuid-strategy.md)), audit ([011](./011-audit-log-format.md)) |
| MVP-2 Finance | Done | Money as integer paise ([012](./012-money-currency.md)); invoices, payments, receipts, collection report |
| MVP-3 Community | In progress | Notices, complaints, meetings shipped; attachments + notifications open |
| Local Mongo | Required | Replica set via `pnpm mongo:rs` (port **27018**); `DATABASE_URL` must include `replicaSet=rs0&directConnection=true` per [017](./017-mongodb.md) |

## Index

| ID | Title | Status |
|----|-------|--------|
| [001](./001-nodejs-version.md) | Node.js version | Accepted |
| [002](./002-package-pins.md) | Package version pins | Accepted |
| [003](./003-uuid-strategy.md) | Document ID strategy (ObjectId) | Accepted (amended) |
| [004](./004-auth-session.md) | Authentication / session | Accepted |
| [005](./005-tenant-resolution.md) | Tenant resolution | Accepted |
| [006](./006-prisma-tenancy.md) | Prisma tenancy enforcement | Accepted (amended) |
| [007](./007-object-storage.md) | Object storage abstraction | Accepted |
| [008](./008-email-provider.md) | Email provider abstraction | Accepted |
| [009](./009-frontend-server-state.md) | Frontend server state | Accepted |
| [010](./010-api-error-schema.md) | API error schema | Accepted |
| [011](./011-audit-log-format.md) | Audit log format | Accepted |
| [012](./012-money-currency.md) | Money / currency | Accepted (amended) |
| [013](./013-datetime-conventions.md) | Date / time conventions | Accepted |
| [014](./014-deployment-target.md) | Deployment target | Accepted (amended) |
| [015](./015-cicd-target.md) | CI/CD target | Accepted |
| [016](./016-backup-restore.md) | Backup / restore strategy | Accepted (amended) |
| [017](./017-mongodb.md) | MongoDB replaces PostgreSQL | Accepted |
