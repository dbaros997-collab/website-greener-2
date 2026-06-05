import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, staffUsersTable } from "@workspace/db";
import {
  LoginBody,
  LoginResponse,
  LogoutResponse,
  GetCurrentUserResponse,
} from "@workspace/api-zod";
import { verifyPassword, requireAuth } from "../lib/auth";

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

export default router;
