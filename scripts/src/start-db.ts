import EmbeddedPostgres from "embedded-postgres";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);
const databaseDir = path.join(rootDir, ".local", "postgres");
const databaseName = "grace_high_school";

const pg = new EmbeddedPostgres({
  databaseDir,
  user: "postgres",
  password: "postgres",
  port: 5432,
  persistent: true,
});

async function main(): Promise<void> {
  await pg.initialise();
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
}

main().catch((err) => {
  console.error("Failed to start embedded Postgres:", err);
  process.exitCode = 1;
});
