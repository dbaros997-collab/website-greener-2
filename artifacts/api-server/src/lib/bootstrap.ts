import { db, staffUsersTable } from "@workspace/db";
import { hashPassword } from "./auth";
import { logger } from "./logger";

/**
 * Optionally bootstrap a staff account from env on first boot.
 * Prefer leaving ADMIN_USERNAME / ADMIN_PASSWORD unset — the dashboard shows a
 * first-run setup screen that creates the account. If both env vars are set and
 * no staff user exists yet, this still creates one (useful for automated deploys).
 */
export async function ensureAdminUser(): Promise<void> {
  const existing = await db.select().from(staffUsersTable).limit(1);
  if (existing.length > 0) return;

  const username = process.env.ADMIN_USERNAME?.trim();
  const password = process.env.ADMIN_PASSWORD;
  if (!username || !password) {
    logger.info(
      "No staff account yet — open /dashboard/ to create the first admin (ADMIN_USERNAME / ADMIN_PASSWORD not set).",
    );
    return;
  }

  const passwordHash = await hashPassword(password);
  await db.insert(staffUsersTable).values({ username, passwordHash });
  logger.info({ username }, "Bootstrapped initial staff admin account from env");
}
