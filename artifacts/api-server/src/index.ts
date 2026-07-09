import app from "./app";
import { logger } from "./lib/logger";
import { ensureAdminUser } from "./lib/bootstrap";
import { ensureSchema } from "./lib/ensureSchema";

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

function listen(): Promise<void> {
  return new Promise((resolve, reject) => {
    app.listen(port, "0.0.0.0", (err) => {
      if (err) {
        reject(err);
        return;
      }
      logger.info({ port }, "Server listening");
      resolve();
    });
  });
}

async function start(): Promise<void> {
  // Bind HTTP first so Render health checks and static pages work even if
  // Postgres is slow, cold, or temporarily unreachable.
  await listen();

  try {
    await ensureSchema();
    await ensureAdminUser();
  } catch (err) {
    logger.error({ err }, "Post-listen database bootstrap failed");
  }
}

void start().catch((err) => {
  logger.error({ err }, "Failed to start server");
  process.exit(1);
});
