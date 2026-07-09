import { randomBytes, scrypt as scryptCb } from "node:crypto";
import { promisify } from "node:util";
import pg from "pg";

const scrypt = promisify(scryptCb);
const KEYLEN = 64;

async function hashPassword(password) {
  const salt = randomBytes(16);
  const derived = await scrypt(password, salt, KEYLEN);
  return `scrypt:${salt.toString("hex")}:${derived.toString("hex")}`;
}

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL is not set.");
  process.exit(1);
}

const pool = new pg.Pool({ connectionString });

try {
  const username = process.env.ADMIN_USERNAME?.trim();
  const password = process.env.ADMIN_PASSWORD;

  const deleted = await pool.query("DELETE FROM staff_users RETURNING id");
  console.log(`Removed ${deleted.rowCount ?? 0} staff account(s).`);

  if (!username || !password) {
    console.log(
      "Set ADMIN_USERNAME and ADMIN_PASSWORD in .env, then restart the API server (or re-run this script).",
    );
  } else {
    const passwordHash = await hashPassword(password);
    await pool.query(
      "INSERT INTO staff_users (username, password_hash) VALUES ($1, $2)",
      [username, passwordHash],
    );
    console.log(`Created admin account "${username}" from .env values.`);
  }
} catch (err) {
  console.error("Reset failed:", err);
  process.exitCode = 1;
} finally {
  await pool.end();
}
