import app from "./app";
import { logger } from "./lib/logger";
import { pool } from "@workspace/db";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

// Run schema migrations on startup (idempotent)
async function runMigrations() {
  try {
    await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS phone text;`);
    await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS must_change_password boolean NOT NULL DEFAULT false;`);

    // Ensure the platform owner always has admin role
    await pool.query(`
      UPDATE users SET role = 'admin'
      WHERE email = 'olybless89@gmail.com' AND role != 'admin';
    `);

    // Seed the admin account only when explicitly enabled. The INSERT
    // creates it on first boot with the default password and forces a password change.
    // On conflict, only role/status are ensured - password and must_change_password
    // are left untouched so a password set through the UI persists across restarts.
    if (process.env.SEED_ADMIN === "true") {
      const passwordHash = await bcrypt.hash("Aureon2026!", 12);
      const id = crypto.randomUUID();
      await pool.query(
        `INSERT INTO users (id, email, password_hash, first_name, last_name, role, status,
          balance, reward_points, referral_count, member_code, must_change_password, created_at, updated_at)
         VALUES ($1,'admin@aureoncapital.com',$2,'Admin','Capital','admin','active',0,0,0,'AC-ADMIN-0001',true,NOW(),NOW())
         ON CONFLICT (email) DO UPDATE
           SET role = 'admin',
               status = 'active'`,
        [id, passwordHash]
      );
      logger.info("Admin account seeded (SEED_ADMIN=true)");
    } else {
      logger.info("Admin seeding skipped (set SEED_ADMIN=true to enable)");
    }

    logger.info("Migrations OK");
  } catch (err) {
    logger.error({ err }, "Migration failed — continuing anyway");
  }
}

runMigrations().then(() => {
  app.listen(port, (err) => {
    if (err) {
      logger.error({ err }, "Error listening on port");
      process.exit(1);
    }
    logger.info({ port }, "Server listening");
  });
});
