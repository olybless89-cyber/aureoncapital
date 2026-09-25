import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

/**
 * Supabase's direct connection host (db.REF.supabase.co) resolves only to
 * IPv6, which Render's free tier cannot reach (ENETUNREACH).
 * Rewrite the URL to use Supabase's IPv4-capable Session-mode pooler.
 *
 * Direct:  postgres://postgres:PASS@db.REF.supabase.co:5432/postgres
 * Pooler:  postgres://postgres.REF:PASS@aws-0-${REGION}.pooler.supabase.com:5432/postgres
 *
 * The pooler region must match the project's region. Set SUPABASE_POOLER_REGION
 * (e.g. "eu-west-1" or "us-east-1") in the environment; defaults to "eu-west-1".
 * The Supabase dashboard shows the region next to the project reference, and
 * the exact pooler hostname under Connect → Connection string → Session pooler.
 */
function resolveConnectionString(url: string): string {
  // Match the Supabase direct host pattern
  const match = url.match(
    /^(postgres(?:ql)?:\/\/)([^:]+):([^@]+)@db\.([a-z0-9]+)\.supabase\.co(:\d+\/.*)?$/,
  );
  if (!match) return url; // Already a pooler URL or non-Supabase — leave unchanged

  const [, scheme, user, pass, ref, rest] = match;
  const region = process.env.SUPABASE_POOLER_REGION ?? "eu-west-1";
  // Newer projects only resolve on the aws-1-* pooler hosts (aws-0 answers
  // "tenant/user not found"). Override with SUPABASE_POOLER_HOST for legacy projects.
  const poolerHost =
    process.env.SUPABASE_POOLER_HOST ?? `aws-1-${region}.pooler.supabase.com`;
  const port = rest ?? ":5432/postgres";
  const rewritten = `${scheme}${user}.${ref}:${pass}@${poolerHost}${port}`;
  console.log(`[db] Rewrote Supabase direct URL → Session pooler (${poolerHost})`);
  return rewritten;
}

const connectionString = resolveConnectionString(process.env.DATABASE_URL);
const isLocalHost = /@(localhost|127\.0\.0\.1)(:|\/|$)/.test(connectionString);

export const pool = new Pool({
  connectionString,
  ssl: isLocalHost ? false : { rejectUnauthorized: false },
  connectionTimeoutMillis: 10000,
});
export const db = drizzle(pool, { schema });

export * from "./schema";
