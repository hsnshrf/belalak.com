/**
 * Minimal forward-only SQL migration runner.
 * Applies apps/api/migrations/*.sql in filename order, tracking applied files
 * in a `schema_migrations` table. Run via `npm run migrate --workspace apps/api`.
 */
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { Pool } from "pg";
import { config } from "../config";

async function main() {
  const pool = new Pool({ connectionString: config().DATABASE_URL });
  const dir = join(__dirname, "..", "..", "migrations");
  const files = readdirSync(dir).filter((f) => f.endsWith(".sql")).sort();

  await pool.query(
    "CREATE TABLE IF NOT EXISTS schema_migrations (filename text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())",
  );

  for (const file of files) {
    const { rowCount } = await pool.query("SELECT 1 FROM schema_migrations WHERE filename = $1", [file]);
    if (rowCount) continue;
    const sql = readFileSync(join(dir, file), "utf8");
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query(sql);
      await client.query("INSERT INTO schema_migrations (filename) VALUES ($1)", [file]);
      await client.query("COMMIT");
      console.log(`applied ${file}`);
    } catch (err) {
      await client.query("ROLLBACK");
      console.error(`FAILED ${file}`);
      throw err;
    } finally {
      client.release();
    }
  }
  await pool.end();
  console.log("migrations up to date");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
