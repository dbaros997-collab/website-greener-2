import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

const connectionString = process.env.DATABASE_URL;

// External Render Postgres URLs require TLS; internal URLs usually do not.
// Enabling TLS with rejectUnauthorized:false is safe for both and avoids hangs.
const useSsl =
  process.env.PGSSL === "true" ||
  /render\.com/i.test(connectionString) ||
  /[?&]sslmode=require/i.test(connectionString);

export const pool = new Pool({
  connectionString,
  connectionTimeoutMillis: 10_000,
  idleTimeoutMillis: 30_000,
  max: 10,
  ssl: useSsl ? { rejectUnauthorized: false } : undefined,
});
export const db = drizzle(pool, { schema });

export * from "./schema";
