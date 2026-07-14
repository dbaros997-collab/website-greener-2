import { eq } from "drizzle-orm";
import { db, staffUsersTable } from "@workspace/db";
import { hashPassword } from "./auth";
import { logger } from "./logger";

function envFlagEnabled(name: string): boolean {
  const raw = process.env[name]?.trim().toLowerCase();
  return raw === "1" || raw === "true" || raw === "yes";
}

/**
 * Bootstrap staff accounts from ADMIN_USERNAME / ADMIN_PASSWORD.
 *
 * IMPORTANT: By default we only CREATE the first admin when the table is empty.
 * We do NOT rewrite an existing password on every deploy — that was why login
 * kept failing after each admin/site update whenever Render env credentials
 * differed from the password chosen on /dashboard/.
 *
 * To force the DB password to match Render env on boot (recovery), set:
 *   ADMIN_SYNC_PASSWORD=true
 */
export async function ensureAdminUser(): Promise<void> {
  const username = process.env.ADMIN_USERNAME?.trim();
  const password = process.env.ADMIN_PASSWORD;
  const syncPassword = envFlagEnabled("ADMIN_SYNC_PASSWORD");

  const existingRows = await db.select().from(staffUsersTable).limit(5);
  const hasAnyAdmin = existingRows.length > 0;

  if (hasAnyAdmin && !syncPassword) {
    // Leave the password the operator set via /dashboard/ alone.
    return;
  }

  if (!username || !password) {
    if (!hasAnyAdmin) {
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
  const [matching] = await db
    .select()
    .from(staffUsersTable)
    .where(eq(staffUsersTable.username, username))
    .limit(1);

  if (matching) {
    if (!syncPassword) {
      return;
    }
    await db
      .update(staffUsersTable)
      .set({ passwordHash })
      .where(eq(staffUsersTable.id, matching.id));
    logger.info(
      { username },
      "Synced staff admin password from env (ADMIN_SYNC_PASSWORD=true)",
    );
    return;
  }

  if (hasAnyAdmin && !syncPassword) {
    return;
  }

  // No matching username yet — create the env-named admin (first boot or recovery).
  await db.insert(staffUsersTable).values({ username, passwordHash });
  logger.info(
    { username },
    "Bootstrapped staff admin account from ADMIN_USERNAME / ADMIN_PASSWORD",
  );
}
