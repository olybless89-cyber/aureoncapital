# Tesla Pro Platform

A premium membership and investment admin platform with a cinematic dark-navy design, Tesla red accents, and a full member + admin experience.

## Run & Operate

- `pnpm --filter @workspace/tesla-pro run dev` — frontend (port auto-assigned, served at `/`)
- `pnpm --filter @workspace/api-server run dev` — API server (port 8080, served at `/api`)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string (point to Supabase for production)
- Required env: `SESSION_SECRET` — used as JWT signing key

## Test Credentials

| Role  | Email                    | Password   |
|-------|--------------------------|------------|
| Admin | admin@teslapro.com       | admin123   |
| User  | sarah.chen@email.com     | user123    |
| User  | james.morris@email.com   | user123    |

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite + Tailwind CSS + shadcn/ui + framer-motion + wouter
- API: Express 5 with JWT authentication (jsonwebtoken + bcryptjs)
- DB: PostgreSQL + Drizzle ORM (point DATABASE_URL to Supabase for production)
- Validation: Zod, drizzle-zod, Orval codegen
- Build: esbuild (API), Vite (frontend)

## Where Things Live

- `artifacts/tesla-pro/` — React frontend (static, deploy to Netlify/Vercel/Cloudflare Pages)
- `artifacts/api-server/` — Express API backend (deploy to Railway/Render, pointed at Supabase DB)
- `lib/api-spec/openapi.yaml` — single source of truth for all API contracts
- `lib/api-client-react/` — generated React Query hooks (auto-generated, don't edit)
- `lib/api-zod/` — generated Zod schemas used by the server (auto-generated, don't edit)
- `lib/db/src/schema/` — Drizzle table definitions (users.ts, orders.ts)

## Architecture Decisions

- JWT tokens stored in localStorage, sent as `Authorization: Bearer <token>` on every request
- Custom fetch in `lib/api-client-react/src/custom-fetch.ts` auto-attaches the token
- Frontend is a static build — all API calls go to `/api/*` via the shared proxy
- Backend uses `SESSION_SECRET` env var as JWT signing key (falls back to dev default)
- Password hashing with bcryptjs (10 rounds)
- Single Express API server handles auth, stats, users, and orders
- To deploy on Supabase: set `DATABASE_URL` to your Supabase PostgreSQL connection string on your backend host

## Deploying (Supabase Split)

1. **Backend:** Deploy `artifacts/api-server` to Railway/Render/Fly.io, set `DATABASE_URL` to your Supabase PostgreSQL URL and `SESSION_SECRET` to a secure random string
2. **Frontend:** Build `artifacts/tesla-pro` (`pnpm --filter @workspace/tesla-pro run build`), deploy `dist/public/` to Netlify/Vercel/Cloudflare Pages, set the API base URL to your backend's public URL

## User Preferences

_Populate as you build._

## Gotchas

- After changing the OpenAPI spec, always run codegen before touching backend routes or frontend hooks
- `zod.email()` is Zod v4 syntax — don't use `format: email` in the OpenAPI spec; use plain `type: string`
- Push DB schema with `pnpm --filter @workspace/db run push` after any schema changes
