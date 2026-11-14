/**
 * One-shot migration runner. Runs as the `migrate` service in Docker Compose
 * before `web` and `worker` start.
 */
import { existsSync } from "node:fs";
import path from "node:path";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

const migrationsFolder = path.resolve(process.cwd(), "drizzle");

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");

  if (!existsSync(path.join(migrationsFolder, "meta", "_journal.json"))) {
    console.log("[migrate] no migrations yet – nothing to do");
    return;
  }

  const sql = postgres(url, { max: 1 });
  try {
    await migrate(drizzle(sql), { migrationsFolder });
    console.log("[migrate] database is up to date");
  } finally {
    await sql.end();
  }
}

main().catch((err: unknown) => {
  console.error("[migrate] failed:", err instanceof Error ? err.message : err);
  process.exit(1);
});
