---
name: Supabase + Render connectivity
description: How to connect Supabase from Render free tier — IPv6 issue, pooler region, startup migration pattern
---

## Problem
Supabase's direct connection host (`db.PROJECT_REF.supabase.co`) resolves **only to IPv6** (AAAA record, no A record). Render's free tier cannot make outbound IPv6 connections → every DB query fails with `ENETUNREACH`.

## Fix (code-level, no Render env var change needed)
`lib/db/src/index.ts` rewrites the direct URL to the Session-mode pooler at startup via `resolveConnectionString()`:

- Direct:  `postgres://postgres:PASS@db.REF.supabase.co:5432/postgres`
- Pooler:  `postgres://postgres.REF:PASS@aws-0-REGION.pooler.supabase.com:5432/postgres`

**Why:** Pooler hosts have A records (IPv4). Render can reach them. SSL `{ rejectUnauthorized: false }` is required.

## Correct pooler region for project `amboevastovqdiscjxig`
`aws-0-eu-west-1.pooler.supabase.com` (Ireland).

**How to find for any project:** probe all regions with a dummy password — the region where the tenant exists returns `password authentication failed` (not `tenant not found`).

## Startup migration pattern
`artifacts/api-server/src/index.ts` runs `ALTER TABLE users ADD COLUMN IF NOT EXISTS phone text;` before `app.listen()`. This ensures the production DB schema stays in sync without a manual migration step.

## Diagnostic endpoint
`GET /api/healthz/db` runs `SELECT 1` and returns `{"db":"ok"}` or `{"db":"error","message":"...","code":"..."}`. Keep it for future debugging.
