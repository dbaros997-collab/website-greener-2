import app from "./app";
import { logger } from "./lib/logger";
import { ensureAdminUser } from "./lib/bootstrap";

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

async function start(): Promise<void> {
  // Make sure a staff account exists so the admin dashboard is usable on first
  // boot. Failures here must not prevent the server from serving traffic.
  try {
    await ensureAdminUser();
  } catch (err) {
    logger.error({ err }, "Failed to bootstrap admin account");
  }

  app.listen(port, "0.0.0.0", (err) => {
    if (err) {
      logger.error({ err }, "Error listening on port");
      process.exit(1);
    }

    logger.info({ port }, "Server listening");
  });
}

void start();
