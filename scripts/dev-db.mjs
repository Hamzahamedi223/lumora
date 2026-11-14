// Starts a real local PostgreSQL server for development (no Docker needed).
// In production set DATABASE_URL / DIRECT_URL to your hosted Postgres (e.g. Supabase) instead.
import EmbeddedPostgres from "embedded-postgres";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

const dir = resolve(".pgdata");
const pg = new EmbeddedPostgres({ databaseDir: dir, user: "lumora", password: "lumora_dev", port: 5434, persistent: true });

if (!existsSync(dir)) await pg.initialise();
await pg.start();
try {
  await pg.createDatabase("lumora");
} catch {
  /* already exists */
}
console.log("Postgres ready: postgresql://lumora:lumora_dev@localhost:5434/lumora");

const stop = async () => {
  await pg.stop();
  process.exit(0);
};
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
setInterval(() => {}, 1 << 30);
