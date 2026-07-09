import EmbeddedPostgres from "embedded-postgres";
import { existsSync, readFileSync, unlinkSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);
const databaseDir = path.join(rootDir, ".local", "postgres");
const databaseName = "grace_high_school";

function removeStalePidFile() {
  const pidFile = path.join(databaseDir, "postmaster.pid");
  if (!existsSync(pidFile)) return;

  const pid = Number.parseInt(readFileSync(pidFile, "utf8").split("\n")[0] ?? "", 10);
  if (!Number.isFinite(pid)) {
    unlinkSync(pidFile);
    console.log("Removed invalid postmaster.pid.");
    return;
  }

  try {
    process.kill(pid, 0);
    console.log(`Postgres already running (pid ${pid}).`);
    process.exit(0);
  } catch {
    unlinkSync(pidFile);
    console.log(`Removed stale postmaster.pid for pid ${pid}.`);
  }
}

const pg = new EmbeddedPostgres({
  databaseDir,
  user: "postgres",
  password: "postgres",
  port: 5432,
  persistent: true,
});

try {
  const clusterReady = existsSync(path.join(databaseDir, "PG_VERSION"));

  if (!clusterReady) {
    await pg.initialise();
  } else {
    removeStalePidFile();
    console.log("Using existing Postgres data directory.");
  }

  await pg.start();

  try {
    await pg.createDatabase(databaseName);
    console.log(`Created database "${databaseName}".`);
  } catch {
    console.log(`Database "${databaseName}" already exists.`);
  }

  console.log(
    `Postgres ready at postgresql://postgres:postgres@localhost:5432/${databaseName}`,
  );
  console.log("Press Ctrl+C to stop.");

  const shutdown = async () => {
    await pg.stop();
    process.exit(0);
  };
  process.on("SIGINT", () => void shutdown());
  process.on("SIGTERM", () => void shutdown());
} catch (err) {
  console.error("Failed to start embedded Postgres:", err);
  process.exitCode = 1;
}
