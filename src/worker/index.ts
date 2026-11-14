/**
 * Background worker – separate process from the web app.
 * Uses pg-boss (job queue inside PostgreSQL, no Redis).
 *
 * Phase 0: starts the queue and runs a heartbeat so we can see the worker is alive.
 * Phase 1 adds: feed checks (hourly), full price refresh (05:30 / 17:30), retention jobs.
 */
import PgBoss from "pg-boss";

const TZ = process.env.JOB_TIMEZONE ?? "Europe/Vienna";

const QUEUES = {
  heartbeat: "system.heartbeat",
} as const;

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL is not set");

  const boss = new PgBoss({ connectionString, schema: "pgboss" });
  boss.on("error", (err) => console.error("[worker] pg-boss error:", err.message));

  await boss.start();

  await boss.createQueue(QUEUES.heartbeat);
  await boss.schedule(QUEUES.heartbeat, "*/15 * * * *", {}, { tz: TZ });

  await boss.work(QUEUES.heartbeat, async () => {
    console.log(`[worker] heartbeat ${new Date().toISOString()}`);
  });

  console.log(`[worker] started (tz=${TZ})`);

  const shutdown = async (signal: string) => {
    console.log(`[worker] ${signal} received, stopping…`);
    await boss.stop({ graceful: true, timeout: 20_000 });
    process.exit(0);
  };
  process.on("SIGTERM", () => void shutdown("SIGTERM"));
  process.on("SIGINT", () => void shutdown("SIGINT"));
}

main().catch((err: unknown) => {
  console.error("[worker] fatal:", err instanceof Error ? err.message : err);
  process.exit(1);
});
