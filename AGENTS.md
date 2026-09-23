## Context
Facturly API: backend-only B2B invoicing SaaS API — no frontend in this repo.
Stack: Node.js, Hono.js, Drizzle ORM (`postgres.js` driver), Zod v4, argon2 (argon2id), jose (JWT access + refresh).
Database: Supabase used exclusively as a PostgreSQL host via direct TCP (Supavisor transaction pooler, port 6543, `postgres` superuser role) — no Supabase SDK, no PostgREST, RLS has no practical effect on this access path.
Module system: ESM, TypeScript with `NodeNext` resolution — relative imports use the `.js` extension even though source files are `.ts` (e.g. `import { db } from '../../config/db.js'`).

## Commands
- Install: `npm install`
- Dev: `npm run dev` (tsx watch on `src/index.ts`)
- Build: `npm run build` (`tsc`)
- Start (built): `npm run start`
- Generate migration: `npm run db:generate`
- Apply migration: `npm run db:migrate` — in practice, migrations are applied manually through the Supabase SQL Editor (direct TCP port 5432 is blocked from Boris's machine); don't assume `db:migrate` runs end-to-end.
- No linter and no automated test suite configured. To validate a task: `npm run build`, then exercise the endpoint manually with the `.http` files in `api-test/` (REST Client format).

## Architecture
Feature-sliced under `src/features/`: `auth`, `organizations`, `users`, `invoices`, `subscriptions`, `logs`, `cache`.
Each feature typically has: `*.routes.ts`, `*.service.ts`, `*.schema.ts`.
- `src/config/`: env loading, db client
- `src/db/schema/`: Drizzle schema definitions
- `src/db/migrations/`: generated SQL migrations
- `src/shared/middlewares/`: auth guard, logging, rate limiting, etc.
- `src/shared/utils/`: helpers (e.g. `response.ts` for `sendSuccess`/`sendError`)
- `src/shared/types/`: shared TS types
- `src/index.ts`: app entry point

## Code conventions
- Zod v4 syntax: `z.email()`, `z.uuid()`, `z.enum([...], { message: '...' })` (not `errorMap`)
- Hono instances typed with `Variables` to read `c.get('auth')`, e.g. `new Hono<{ Variables: { auth: AuthPayload } }>()`
- Import `or()` / `and()` from `drizzle-orm`, never from the `db` instance
- Paginated query params: `z.coerce.number().default(...).pipe(...)`
- The logging middleware detects errors via `c.res.status >= 400` after `next()`, not try/catch — routes signal failure through `sendError()` without throwing
- Route convention: action before ID (e.g. `/invoices/paid/:id`, not `/invoices/:id/paid`)
- Reference feature to imitate for structure/style: `src/features/invoices`

## Domain rules
- `ADMIN` role has no organization; `USER` role requires one
- `USER`s are blocked if their organization is not `ACTIVE`
- Invoice amounts are whole FCFA integers (no decimals)
- Invoice numbering format: `FAC-YYYYMMDD-XXXX`
- Subscriptions have a fixed 12-month duration, history kept as multiple rows

## Workflow
- Commits: Conventional Commits (`feat`, `fix`, `docs`, `chore`, …)
- One commit per unit of work
- Branches must start with `borisaxel/`
- Never push to `master`, never use `--force`
- Before each push, check that `.env` and `.env.production` are listed in `.gitignore`

## Limits
- Never read, edit or delete `.env` (`.env.example` may be read/edited)
- Dependencies: always use the CLI (`npm i <package>`), never edit versions by hand
- Ask permission before:
    - installing a new dependency
    - changing the folder/architecture structure
    - modifying a Drizzle schema (`src/db/schema/`) or generating/applying a migration
    - changing auth/JWT or rate-limiting logic