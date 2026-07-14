import { eq } from "drizzle-orm";
import { db, staffUsersTable } from "@workspace/db";
import { hashPassword } from "./auth";
import { logger } from "./logger";

/**
 * Keep the staff admin aligned with ADMIN_USERNAME / ADMIN_PASSWORD when both
 * are set in the environment (Render Dashboard → Environment).
 *
 * - No staff user yet → create one
 * - Username exists → refresh its password hash
 * - Env unset → leave DB alone (first-run /dashboard/ setup still works)
 *
 * This stops the recurring “password won’t work” issue after redeploys / DB
 * rebuilds, as long as the Render env vars stay set.
 */
export async function ensureAdminUser(): Promise<void> {
  const username = process.env.ADMIN_USERNAME?.trim();
  const password = process.env.ADMIN_PASSWORD;

  if (!username || !password) {
    const existing = await db.select().from(staffUsersTable).limit(1);
    if (existing.length === 0) {
      logger.info(
        "No staff account yet — open /dashboard/ to create the first admin (ADMIN_USERNAME / ADMIN_PASSWORD not set).",
      );
    }
    return;
  }

  if (password.length < 6) {
    logger.warn(
      "ADMIN_PASSWORD is set but shorter than 6 characters — skipping bootstrap.",
    );
    return;
  }

  const passwordHash = await hashPassword(password);
  const [existing] = await db
    .select()
    .from(staffUsersTable)
    .where(eq(staffUsersTable.username, username))
    .limit(1);

  if (existing) {
    await db
      .update(staffUsersTable)
      .set({ passwordHash })
      .where(eq(staffUsersTable.id, existing.id));
    logger.info(
      { username },
      "Synced staff admin password from ADMIN_USERNAME / ADMIN_PASSWORD",
    );
    return;
  }

  // Env username is new — if another admin already exists, still create this
  // named account so Render credentials always work.
  await db.insert(staffUsersTable).values({ username, passwordHash });
  logger.info(
    { username },
    "Bootstrapped staff admin account from ADMIN_USERNAME / ADMIN_PASSWORD",
  );
}
