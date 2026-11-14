import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "postgres://napfdeal:napfdeal@localhost:5432/napfdeal",
  },
  strict: true,
  verbose: true,
});
