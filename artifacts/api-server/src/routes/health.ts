import { Router, type IRouter } from "express";
import { HealthCheckResponse } from "@workspace/api-zod";
import { pool } from "@workspace/db";

const router: IRouter = Router();

router.get("/healthz", (_req, res) => {
  const data = HealthCheckResponse.parse({ status: "ok" });
  res.json(data);
});

// DB connectivity diagnostic — remove after confirming Render works
router.get("/healthz/db", async (_req, res): Promise<void> => {
  try {
    const result = await pool.query("SELECT 1 AS ok");
    res.json({ db: "ok", row: result.rows[0] });
  } catch (err: any) {
    res.status(500).json({ db: "error", message: err.message, code: err.code });
  }
});

// Read-only schema introspection — shows exactly what columns exist on the
// live `users` table so we can compare against lib/db/src/schema/users.ts
// without needing any DB credentials. Remove once the drift is resolved.
router.get("/healthz/schema", async (_req, res): Promise<void> => {
  try {
    const result = await pool.query(
      `SELECT column_name, data_type, is_nullable, column_default
       FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name = 'users'
       ORDER BY ordinal_position`
    );
    res.json({ db: "ok", table: "users", columns: result.rows });
  } catch (err: any) {
    res.status(500).json({ db: "error", message: err.message, code: err.code });
  }
});

// Read-only, credential-free check of WHICH database this server is
// actually talking to. The live `users` table turned out to have a totally
// different shape than lib/db/src/schema/users.ts (integer id, `password`
// instead of `password_hash`, kyc_status/two_factor/pin_hash columns, no
// balance/reward_points/member_code) — that smells like this Render service
// is pointed at a different app's Supabase project rather than a schema
// that just drifted a little. This masks the password so it's safe to hit.
router.get("/healthz/dbinfo", async (_req, res): Promise<void> => {
  try {
    const raw = process.env.DATABASE_URL || "";
    const masked = raw.replace(/:([^:@/]+)@/, ":****@");
    const result = await pool.query(
      `SELECT current_database() AS database,
              inet_server_addr()::text AS server_addr,
              (SELECT count(*)::int FROM information_schema.tables WHERE table_schema = 'public') AS table_count`
    );
    const tables = await pool.query(
      `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name`
    );
    res.json({
      db: "ok",
      connectionStringMasked: masked,
      ...result.rows[0],
      tables: tables.rows.map((r: any) => r.table_name),
    });
  } catch (err: any) {
    res.status(500).json({ db: "error", message: err.message, code: err.code });
  }
});

export default router;
