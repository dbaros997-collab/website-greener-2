import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, staffUsersTable } from "@workspace/db";
import {
  LoginBody,
  LoginResponse,
  LogoutResponse,
  GetCurrentUserResponse,
  ResetPasswordBody,
  ResetPasswordResponse,
  GetSetupStatusResponse,
  SetupAdminBody,
  SetupAdminResponse,
} from "@workspace/api-zod";
import { hashPassword, verifyPassword, requireAuth, verifyResetSecret } from "../lib/auth";

const router: IRouter = Router();

async function staffAccountExists(): Promise<boolean> {
  const existing = await db.select().from(staffUsersTable).limit(1);
  return existing.length > 0;
}

router.get("/auth/setup-status", async (_req, res): Promise<void> => {
  const needsSetup = !(await staffAccountExists());
  res.json(GetSetupStatusResponse.parse({ needsSetup }));
});

router.post("/auth/setup", async (req, res): Promise<void> => {
  try {
    if (await staffAccountExists()) {
      res.status(409).json({ error: "An admin account already exists. Sign in instead." });
      return;
    }

    const parsed = SetupAdminBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: "Invalid request. Username and password (min 6 characters) are required.",
      });
      return;
    }

    const username = parsed.data.username.trim();
    if (!username) {
      res.status(400).json({ error: "Username is required." });
      return;
    }

    // Re-check immediately before insert to reduce race windows.
    if (await staffAccountExists()) {
      res.status(409).json({ error: "An admin account already exists. Sign in instead." });
      return;
    }

    const passwordHash = await hashPassword(parsed.data.password);
    const inserted = await db
      .insert(staffUsersTable)
      .values({ username, passwordHash })
      .returning({
        id: staffUsersTable.id,
        username: staffUsersTable.username,
      });

    const user = inserted[0];
    if (!user) {
      res.status(500).json({ error: "Failed to create admin account." });
      return;
    }

    req.session.userId = user.id;
    req.session.username = user.username;

    await new Promise<void>((resolve, reject) => {
      req.session.save((err) => (err ? reject(err) : resolve()));
    });

    req.log.info({ username: user.username }, "Created first staff admin via setup");
    res.json(SetupAdminResponse.parse({ id: user.id, username: user.username }));
  } catch (err) {
    req.log.error({ err }, "Setup admin failed");
    res.status(500).json({
      error:
        "Failed to create admin account. Confirm the database is reachable, then try again.",
    });
  }
});

router.post("/auth/login", async (req, res): Promise<void> => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  const username = parsed.data.username.trim();
  if (!username) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  // Prefer exact match; fall back to case-insensitive match for older accounts.
  const exact = await db
    .select()
    .from(staffUsersTable)
    .where(eq(staffUsersTable.username, username))
    .limit(1);

  let user: (typeof exact)[number] | undefined = exact[0];
  if (!user) {
    const all = await db.select().from(staffUsersTable);
    user = all.find((u) => u.username.toLowerCase() === username.toLowerCase());
  }

  if (!user || !(await verifyPassword(parsed.data.password, user.passwordHash))) {
    // Help operators when the DB has no staff row yet (common after free-tier resets).
    if (!(await staffAccountExists())) {
      res.status(401).json({
        error: "No admin account exists yet. Open /dashboard/ to create one.",
      });
      return;
    }
    req.log.warn({ username }, "Failed login attempt");
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  req.session.userId = user.id;
  req.session.username = user.username;
  res.json(LoginResponse.parse({ id: user.id, username: user.username }));
});

router.post("/auth/logout", async (req, res): Promise<void> => {
  req.session.destroy((err) => {
    if (err) {
      req.log.error({ err }, "Failed to destroy session");
      res.status(500).json({ error: "Failed to log out" });
      return;
    }
    res.clearCookie("connect.sid", { path: "/" });
    res.json(LogoutResponse.parse({ ok: true }));
  });
});

router.get("/auth/me", requireAuth, async (req, res): Promise<void> => {
  res.json(
    GetCurrentUserResponse.parse({
      id: req.session.userId,
      username: req.session.username,
    }),
  );
});

router.post("/auth/reset-password", async (req, res): Promise<void> => {
  const resetSecret = process.env.PASSWORD_RESET_SECRET;
  if (!resetSecret) {
    res.status(503).json({
      error: "Password reset is not configured on this server.",
    });
    return;
  }

  const parsed = ResetPasswordBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request" });
    return;
  }

  if (!verifyResetSecret(parsed.data.resetCode, resetSecret)) {
    req.log.warn({ username: parsed.data.username }, "Failed password reset attempt");
    res.status(401).json({ error: "Invalid recovery code or username." });
    return;
  }

  const [user] = await db
    .select()
    .from(staffUsersTable)
    .where(eq(staffUsersTable.username, parsed.data.username));

  if (!user) {
    req.log.warn({ username: parsed.data.username }, "Failed password reset attempt");
    res.status(401).json({ error: "Invalid recovery code or username." });
    return;
  }

  const passwordHash = await hashPassword(parsed.data.newPassword);
  await db
    .update(staffUsersTable)
    .set({ passwordHash })
    .where(eq(staffUsersTable.id, user.id));

  req.log.info({ username: user.username }, "Staff password reset via recovery code");
  res.json(ResetPasswordResponse.parse({ ok: true }));
});

export default router;
