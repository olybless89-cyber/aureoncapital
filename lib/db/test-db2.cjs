// Connects using separate PG* env vars instead of a single DATABASE_URL
// string, to rule out URL-encoding issues if the password has special
// characters.
const { Pool } = require("pg");

const required = ["PGHOST", "PGPORT", "PGDATABASE", "PGUSER", "PGPASSWORD"];
const missing = required.filter((k) => !process.env[k]);
if (missing.length) {
  console.error("Missing env vars:", missing.join(", "));
  process.exit(1);
}

const pool = new Pool({
  host: process.env.PGHOST,
  port: Number(process.env.PGPORT),
  database: process.env.PGDATABASE,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 15000,
});

pool
  .query("SELECT 1 AS ok, current_database() AS db")
  .then((res) => {
    console.log("CONNECTION OK:", res.rows[0]);
    return pool.end();
  })
  .catch((err) => {
    console.error("CONNECTION FAILED");
    console.error("message:", err.message);
    console.error("code:", err.code);
    console.error("full:", err);
    process.exit(1);
  });
