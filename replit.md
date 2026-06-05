# [Project name]

_Replace the heading above with the project's name, and this line with one sentence describing what this app does for users._

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- Website UI: `artifacts/grace-high-school/src/App.tsx` (single-file sections; nav links live in two identical arrays) + `src/index.css` (responsive grids).
- API server: `artifacts/api-server/src/routes/` — `storage.ts` (presigned uploads + object serving), `resources.ts` (past papers / holiday work CRUD), wired in `routes/index.ts`.
- API contract (source of truth): `lib/api-spec/openapi.yaml` → run codegen to regenerate hooks + zod schemas.
- DB schema: `lib/db/src/schema/` — `resources.ts` holds the downloadable-resources table.
- Object storage helpers: `artifacts/api-server/src/lib/objectStorage.ts`.

## Architecture decisions

_Populate as you build — non-obvious choices a reader couldn't infer from the code (3-5 bullets)._

## Product

Grace High School (Gayaza, Uganda) marketing website. Sections: about, programmes, news, updates, **resources** (downloadable past papers & holiday work), campus, videos, admissions, contact. The resources section lets students download files the school shares; uploads currently use an unprotected staff form (password-protected admin login is planned).

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

_Populate as you build — sharp edges, "always run X before Y" rules._

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
