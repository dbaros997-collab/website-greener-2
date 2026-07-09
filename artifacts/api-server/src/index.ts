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

  try {
    await mountApiRoutes(app);
  } catch (err) {
    logger.error({ err }, "Failed to mount API routes");
  }

  try {
    const { ensureSchema } = await import("./lib/ensureSchema");
    const { ensureAdminUser } = await import("./lib/bootstrap");
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
