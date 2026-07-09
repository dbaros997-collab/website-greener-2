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
} from "@workspace/api-zod";
import { hashPassword, verifyPassword, requireAuth, verifyResetSecret } from "../lib/auth";

const router: IRouter = Router();

router.post("/auth/login", async (req, res): Promise<void> => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  const [user] = await db
    .select()
    .from(staffUsersTable)
    .where(eq(staffUsersTable.username, parsed.data.username));

  if (!user || !(await verifyPassword(parsed.data.password, user.passwordHash))) {
    req.log.warn({ username: parsed.data.username }, "Failed login attempt");
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
