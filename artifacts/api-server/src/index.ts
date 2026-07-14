import { createBaseApp, mountApiRoutes } from "./app";
import { logger } from "./lib/logger";

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

const app = createBaseApp();

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
  // Bind immediately with health + static files only — no DB imports yet.
  await listen();

  // Schema must exist before session middleware / auth routes touch Postgres.
  try {
    const { ensureSchema } = await import("./lib/ensureSchema");
    await ensureSchema();
  } catch (err) {
    logger.error({ err }, "Failed to ensure database schema");
  }

  try {
    await mountApiRoutes(app);
  } catch (err) {
    logger.error({ err }, "Failed to mount API routes");
  }

  try {
    const { ensureAdminUser } = await import("./lib/bootstrap");
    await ensureAdminUser();
  } catch (err) {
    logger.error({ err }, "Post-listen admin bootstrap failed");
  }
}

void start().catch((err) => {
  logger.error({ err }, "Failed to start server");
  process.exit(1);
});
