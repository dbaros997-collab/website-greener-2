import { db, staffUsersTable } from "@workspace/db";
import { hashPassword } from "./auth";
import { logger } from "./logger";

/**
 * Ensure at least one staff account exists so the admin dashboard is usable on
 * first boot without a manual seed step. Runs idempotently on every startup:
 * if any staff user already exists it does nothing; otherwise it creates one
 * from ADMIN_USERNAME / ADMIN_PASSWORD when both are present.
 */
export async function ensureAdminUser(): Promise<void> {
  const existing = await db.select().from(staffUsersTable).limit(1);
  if (existing.length > 0) return;

  const username = process.env.ADMIN_USERNAME;
  const password = process.env.ADMIN_PASSWORD;
  if (!username || !password) {
    logger.warn(
      "No staff account exists and ADMIN_USERNAME / ADMIN_PASSWORD are not set — admin login will be unavailable until one is created.",
    );
    return;
  }

  const passwordHash = await hashPassword(password);
  await db.insert(staffUsersTable).values({ username, passwordHash });
  logger.info({ username }, "Bootstrapped initial staff admin account");
}
