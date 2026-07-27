# UrbanGate 2.0

Multi-tenant society management SaaS (greenfield rebuild). See [docs/PROJECT-PLANNER.md](docs/PROJECT-PLANNER.md) and [docs/URBANGATE-2-MASTER-SPEC.md](docs/URBANGATE-2-MASTER-SPEC.md).

## Prerequisites

- Node.js **22+** (pin via `.nvmrc`; Node 24 also works for local scaffold)
- [pnpm](https://pnpm.io/) 9.x (`npm install -g pnpm@9`)
- **MongoDB replica set** reachable via `DATABASE_URL` (local `pnpm mongo:rs` or [Atlas](https://www.mongodb.com/atlas))
- Docker Desktop **later** (optional) — `docker compose up -d` starts MongoDB + Redis

## Quick start

```bash
cp .env.example .env
pnpm install
pnpm mongo:rs          # local replica set on :27018
pnpm db:generate
pnpm db:reset          # push schema + demo seed
pnpm dev               # API + all web apps (pnpm recursive; no Turbo)
```

Demo accounts (password `Password123!`):

- `admin@urbangate.demo` — society admin (http://localhost:3000)
- `guard@urbangate.demo` — security gate desk (http://localhost:3003)

| Service | URL |
|---------|-----|
| API health | http://localhost:3001/api/v1/health |
| Admin web | http://localhost:3000 |
| Resident web | http://localhost:3002 |
| Security web | http://localhost:3003 |
| MongoDB (rs0) | `mongodb://127.0.0.1:27018/urbangate?replicaSet=rs0&directConnection=true` |
| Redis | localhost:6379 (Compose / optional) |

> **Database:** MongoDB is the primary store ([ADR-017](docs/decisions/017-mongodb.md)). A future PostgreSQL migration path is documented there but **not** active — do not install Postgres for this project unless that ADR is superseded.
>
> **Note:** Dev scripts use `pnpm -r` instead of Turborepo. On some Windows machines, Application Control blocks `turbo.exe` (`Error: spawn UNKNOWN`).

## Society setup

Guided onboarding lives at **http://localhost:3000/setup** (also linked from the sidebar and dashboard CTA):

1. Create or select a society  
2. Add buildings / wings  
3. Add units (bulk rows)  
4. Invite members and assign units  
5. Done — jump to Finance / Maintenance  

Day-to-day CRUD pages (`/societies`, `/buildings`, `/units`, `/members`) remain for edits.

## Demo seed

`pnpm db:seed` (or `pnpm db:reset`) **wipes all data** and loads Green Valley Residency.

Password for all demo users: `Password123!`

| Email | Role |
|-------|------|
| `admin@urbangate.demo` | Platform + society admin |
| `treasurer@urbangate.demo` | Treasurer |
| `owner1@urbangate.demo` | Owner (Wing A / 101) |
| `owner2@urbangate.demo` | Owner (A-102, B-201) |

Includes maintenance rules, July 2026 billing run, invoices, and one partial payment.

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start API + all web apps (Turborepo) |
| `pnpm build` | Build all packages and apps |
| `pnpm lint` | Lint |
| `pnpm typecheck` | Typecheck |
| `pnpm test` | Run tests |
| `pnpm mongo:rs` | Start local MongoDB replica set on :27018 |
| `pnpm db:generate` | Prisma generate |
| `pnpm db:push` | Push Prisma schema to MongoDB |
| `pnpm db:seed` | Wipe DB + load demo dataset |
| `pnpm db:reset` | `db:push` then `db:seed` |

## Monorepo layout

```text
apps/api            NestJS API
apps/admin-web      Society + platform admin (Next.js)
apps/resident-web   Resident PWA (Next.js)
apps/security-web   Security/gate PWA (Next.js)
packages/config     Env validation (Zod)
packages/database   Prisma schema + client (MongoDB)
packages/types      Shared TypeScript types
packages/permissions Role → permission map
docs/               Specs, planner, ADRs
```

## Local notes

> The default Windows MongoDB service on port **27017** is not a replica set. Prisma writes need a replica set — use `pnpm mongo:rs` (port **27018**) or Atlas. Match `DATABASE_URL` in `.env` to `.env.example`.

Money is stored as **integer paise** (not Decimal) — see ADR-012 / ADR-017.

## Phase

MVP-2 finance complete (incl. receipts). MVP-3 community started (notices + complaints). Datastore: **MongoDB** ([ADR-017](docs/decisions/017-mongodb.md)).
