import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import { pool } from "@workspace/db";
import type { RequestHandler } from "express";

declare module "express-session" {
  interface SessionData {
    userId?: number;
    username?: string;
  }
}

const PgStore = connectPgSimple(session);

const secret = process.env.SESSION_SECRET;
if (!secret) {
  throw new Error("SESSION_SECRET environment variable is required.");
}

const isLocalDev =
  process.env.NODE_ENV !== "production" && process.env.REPL_ID === undefined;

// Session table is created by ensureSchema() after the HTTP server listens.
// Session middleware backed by Postgres. The Replit preview runs in a
// cross-site iframe served over HTTPS via the shared proxy, so the cookie must
// be SameSite=None + Secure, and the app must trust the proxy (set in app.ts).
export const sessionMiddleware: RequestHandler = session({
  store: new PgStore({
    pool,
    tableName: "session",
    createTableIfMissing: false,
  }),
  secret,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: !isLocalDev,
    sameSite: isLocalDev ? "lax" : "none",
    path: "/",
    maxAge: 1000 * 60 * 60 * 24 * 7,
  },
});
