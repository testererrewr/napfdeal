import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

type Db = PostgresJsDatabase<typeof schema>;

// Lazily created so that `next build` never needs a database connection.
let client: ReturnType<typeof postgres> | undefined;
let db: Db | undefined;

export function getSql() {
  if (!client) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL is not set");
    client = postgres(url, { max: 10, idle_timeout: 30 });
  }
  return client;
}

export function getDb(): Db {
  if (!db) db = drizzle(getSql(), { schema });
  return db;
}
