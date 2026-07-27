# UrbanGate 2.0 — Project Planner

**Status:** MVP complete (MVP-0–6) — Gate C+ unit coverage for tenancy / RBAC / billing / booking / visitor / files  
**Source of truth:** [URBANGATE-2-MASTER-SPEC.md](./URBANGATE-2-MASTER-SPEC.md)  
**Last updated:** 2026-07-28

This is the living roadmap for the UrbanGate 2.0 greenfield rebuild. Implementation must not invent major business rules when the master spec is ambiguous — add a TODO or request a decision instead.

---

## 1. Vision and principles

UrbanGate 2.0 is a multi-tenant society / gated-community management SaaS for India. Rebuild informed by legacy UrbanGate repos; do **not** copy legacy architecture blindly.

Key principles (master spec §§1–4, §31):

- Greenfield TypeScript modular monolith (not microservices)
- API-first; all clients share one versioned API
- Multi-tenancy from day one (shared DB + `society_id`)
- Security and auditability by design
- Serve one society correctly before optimizing for thousands
- Foundation first → validate → vertical slices

Product surfaces:

1. Platform administration
2. Society administration
3. Resident portal / PWA
4. Security portal / PWA
5. Native mobile — **after** PWA MVP is validated

---

## 2. Locked stack and monorepo

| Area | Choice |
|------|--------|
| Runtime | Node.js 22 LTS, TypeScript, pnpm, Turborepo |
| Backend | NestJS, REST `/api/v1`, OpenAPI, Prisma |
| Database | **MongoDB** (shared DB, `societyId` tenancy) — [ADR-017](./decisions/017-mongodb.md) |
| Jobs / cache | Redis, BullMQ (optional until queues needed; Compose deferred) |
| Frontend | Next.js, React, Tailwind CSS, shadcn/ui |
| Apps | `api`, `admin-web`, `resident-web`, `security-web` |
| Storage / email | Abstractions; local/console in dev |
| Mobile | Explicitly later (out of initial MVP) |

### Target layout

```text
urbangate/
├── apps/
│   ├── api/                 # NestJS API
│   ├── admin-web/           # Society + platform admin
│   ├── resident-web/        # Resident PWA
│   └── security-web/        # Security/gate PWA
├── packages/
│   ├── database/            # Prisma schema/client (MongoDB)
│   ├── contracts/           # API DTO/contracts where appropriate
│   ├── permissions/         # permission definitions
│   ├── validation/          # shared validation schemas
│   ├── ui/                  # shared UI primitives where useful
│   ├── config/              # shared configuration
│   └── types/
├── docs/
├── docker/
├── .env.example
├── docker-compose.yml
├── pnpm-workspace.yaml
└── turbo.json
```

Avoid creating shared packages prematurely. A package must have a clear cross-application responsibility.

---

## 3. Phase 0 decision register

All Phase 0 ADRs were **Accepted** on 2026-07-26. **Gate A is passed.** MVP-0 scaffold may begin on explicit request.

| ID | Decision | Status | Doc |
|----|----------|--------|-----|
| ADR-001 | Node.js version | Accepted | [001-nodejs-version.md](./decisions/001-nodejs-version.md) |
| ADR-002 | Package version pins | Accepted | [002-package-pins.md](./decisions/002-package-pins.md) |
| ADR-003 | Document ID strategy (ObjectId) | Accepted (amended) | [003-uuid-strategy.md](./decisions/003-uuid-strategy.md) |
| ADR-004 | Authentication / session | Accepted | [004-auth-session.md](./decisions/004-auth-session.md) |
| ADR-005 | Tenant resolution | Accepted | [005-tenant-resolution.md](./decisions/005-tenant-resolution.md) |
| ADR-006 | Prisma tenancy enforcement | Accepted (amended) | [006-prisma-tenancy.md](./decisions/006-prisma-tenancy.md) |
| ADR-007 | Object storage abstraction | Accepted | [007-object-storage.md](./decisions/007-object-storage.md) |
| ADR-008 | Email provider abstraction | Accepted | [008-email-provider.md](./decisions/008-email-provider.md) |
| ADR-009 | Frontend server state | Accepted | [009-frontend-server-state.md](./decisions/009-frontend-server-state.md) |
| ADR-010 | API error schema | Accepted | [010-api-error-schema.md](./decisions/010-api-error-schema.md) |
| ADR-011 | Audit log format | Accepted | [011-audit-log-format.md](./decisions/011-audit-log-format.md) |
| ADR-012 | Money / currency | Accepted (amended) | [012-money-currency.md](./decisions/012-money-currency.md) |
| ADR-013 | Date / time conventions | Accepted | [013-datetime-conventions.md](./decisions/013-datetime-conventions.md) |
| ADR-014 | Deployment target | Accepted (amended) | [014-deployment-target.md](./decisions/014-deployment-target.md) |
| ADR-015 | CI/CD target | Accepted | [015-cicd-target.md](./decisions/015-cicd-target.md) |
| ADR-016 | Backup / restore strategy | Accepted (amended) | [016-backup-restore.md](./decisions/016-backup-restore.md) |
| ADR-017 | MongoDB replaces PostgreSQL | Accepted | [017-mongodb.md](./decisions/017-mongodb.md) |

---

## 4. MVP roadmap

### MVP-0 — Engineering foundation

- [x] Monorepo (pnpm + Turborepo)
- [x] Docker Compose file prepared for **later** (MongoDB + Redis) — Docker not required for current local work
- [x] MongoDB as primary datastore (Prisma) — local/Atlas via `DATABASE_URL`
- [x] NestJS API app
- [x] Next.js admin, resident, security apps
- [x] Prisma package (MongoDB provider)
- [x] Environment validation + `.env.example`
- [x] Logging + API error conventions
- [x] Health endpoint (`GET /api/v1/health`)
- [x] CI (install, lint, typecheck, tests)
- [x] Test foundation
- [x] `/docs` structure maintained

**Gate B:** Passed (proceeding to MVP-1).

### MVP-1 — Identity and tenant core

- [x] Authentication (register / login / logout / me / switch society, cookie sessions, Argon2id)
- [x] Society (create, list, get, update)
- [x] Buildings / wings
- [x] Units
- [x] Membership (list + invite)
- [x] RBAC (`@urbangate/permissions` + permission guards)
- [x] Resident / unit relationships (assign API)
- [x] Society admin dashboard foundation (admin-web)
- [x] Audit log (append-only service on key actions)
- [x] Society setup wizard (`/setup`: society → buildings → units → members + assign)

### MVP-2 — Finance core

- [x] Maintenance rules
- [x] Billing runs
- [x] Invoice generation and viewing
- [x] Manual payments
- [x] Receipts
- [x] Outstanding balances
- [x] Basic collection report
- [x] Demo seeder (`pnpm db:seed` / `pnpm db:reset`)

### MVP-3 — Community

- [x] Complaints (create + status workflow)
- [x] Notices (draft / publish / archive)
- [x] Meetings (draft / schedule / complete / cancel + minutes)
- [x] Attachments (metadata + local object storage; notice uploads in admin)
- [x] In-app / email notifications (sync fan-out; console email in dev)

### MVP-4 — Gate

- [x] Security users (SECURITY_GUARD / SUPERVISOR roles + demo `guard@urbangate.demo`)
- [x] Security PWA (login, entry, list, lookup, emergency — `:3003`)
- [x] Visitors (create / approve / reject / check-in / check-out)
- [x] Resident approval (approve/reject endpoints for REQUESTED)
- [x] Check-in / check-out
- [x] Member / unit lookup
- [x] Vehicle lookup (basic Vehicle model + search)
- [x] Emergency contacts

### MVP-5 — Facilities and household

- [x] Amenities
- [x] Booking (overlap check + fee/deposit snapshot in paise)
- [x] Vehicles (admin CRUD + gate lookup)
- [x] Household / family
- [x] Service personnel

### MVP-6 — Resident PWA (self-service)

- [x] Resident login + mobile-first shell (`:3002`)
- [x] Dashboard (outstanding, visitors, notices, notifications)
- [x] My invoices (unit-scoped)
- [x] Notices / meetings / notifications
- [x] Visitors (invite + approve/reject)
- [x] Complaints create + list
- [x] Amenity booking
- [x] Household / vehicles / emergency contacts
- [x] Documents module (admin + resident; `SocietyDocument` + attachments)
- [x] PWA install manifest / offline shell polish (resident + security)

Native mobile applications are **not** required before the PWA MVP is validated.

---

## 5. Out of scope (initial MVP)

Do not implement without explicit approval (master §22):

- Microservices, Kubernetes
- Native mobile apps
- AI, facial recognition, ANPR, IoT gate hardware
- Full double-entry accounting suite
- Formal society elections
- WhatsApp / SMS integration
- Online payment gateway
- Biometric attendance
- Marketplace / advertisement system
- Advanced asset management
- Database-per-tenant
- Custom workflow builder

Architecture may leave room for these without building them now.

---

## 6. Work gates

| Gate | Criteria | Status / next step |
|------|----------|--------------------|
| **A** | All Phase 0 ADRs Accepted | **Passed** (2026-07-26) |
| **B** | MVP-0 foundation reviewed | **Passed** — MVP-1 underway |
| **C+** | Each MVP slice ships with required tests (tenancy, RBAC, billing, booking, visitor, files as applicable) | **Passed** — unit specs for tenancy scope, permissions RBAC, money/billing, booking capacity, visitor transitions, attachment entity types |

Do **not** implement business modules until Gate B is passed.

---

## 7. First implementation task (after Gate A)

From master spec §28. Do **not** implement all product modules yet.

1. Create monorepo skeleton (pnpm + Turborepo)
2. Create NestJS API app
3. Create Next.js admin, resident, and security apps
4. Shared TypeScript / ESLint / formatting
5. MongoDB via `DATABASE_URL` (Docker Compose MongoDB + Redis deferred until Docker is available)
6. Prisma package (MongoDB)
7. Environment validation and `.env.example`
8. API health endpoint
9. Structured logging foundation
10. Unit / integration test foundations
11. CI for install, lint, typecheck, and tests
12. Keep `/docs` structure current
13. No business modules until foundation is reviewed

### Acceptance criteria

A new developer should be able to:

```bash
git clone <repo>
pnpm install
pnpm dev
```

Optional when Docker is available: `docker compose up -d` (MongoDB + Redis).

and start the development stack with documented prerequisites and commands.

The API health endpoint must respond successfully, all apps must compile, lint/typecheck must pass, and the initial test suite must pass.

---

## 8. Product success criteria

UrbanGate 2.0 MVP is successful when a real society can (master §30):

1. Onboard its society
2. Configure buildings and units
3. Add / invite residents
4. Assign permissions
5. Configure maintenance
6. Generate bills
7. Record payments and issue receipts
8. Manage complaints and notices
9. Manage gate visitors
10. Allow residents common self-service from a phone
11. Allow security to process visitors quickly
12. Maintain strict tenant isolation and auditable financial / admin actions

---

## 9. Legacy reference

Domain evidence only — do not migrate controllers/models/views directly.

| Repo | Role |
|------|------|
| [NehalPatel/urbangate](https://github.com/NehalPatel/urbangate) | Laravel society admin / operations |
| [NehalPatel/Urbangate.io](https://github.com/NehalPatel/Urbangate.io) | Laravel multi-tenant (DB-per-tenant) variant |
| [NehalPatel/Urbangate-Member](https://github.com/NehalPatel/Urbangate-Member) | Flutter member app |
| [NehalPatel/Urbangate-Security](https://github.com/NehalPatel/Urbangate-Security) | Flutter security / gate app |
| [NehalPatel/Urbangate-Mobile-App](https://github.com/NehalPatel/Urbangate-Mobile-App) | Early Flutter project |

Reuse: business concepts, terminology, valid workflows, useful UX ideas.  
Replace: legacy framework structure, tight coupling, obsolete dependencies, DB-per-tenant for MVP.

---

## 10. Related documentation

| Doc | Purpose |
|-----|---------|
| [URBANGATE-2-MASTER-SPEC.md](./URBANGATE-2-MASTER-SPEC.md) | Full product + Cursor development specification |
| [decisions/](./decisions/) | Architecture Decision Records (Phase 0+) |

Focused §27 docs (`01-PRODUCT-REQUIREMENTS.md`, etc.) can be split incrementally after Gate A; until then the master spec remains authoritative.

---

## Guiding principle

> Do not build everything. Build the foundation, validate it, then implement vertical slices.
