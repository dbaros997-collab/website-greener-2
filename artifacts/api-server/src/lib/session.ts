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

// connect-pg-simple's `createTableIfMissing` reads a `table.sql` file that is
// not included in the esbuild bundle, so we create the session table ourselves.
void pool.query(`
  CREATE TABLE IF NOT EXISTS "session" (
    "sid" varchar NOT NULL COLLATE "default",
    "sess" json NOT NULL,
    "expire" timestamp(6) NOT NULL,
    CONSTRAINT "session_pkey" PRIMARY KEY ("sid")
  );
  CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "session" ("expire");
`);

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
