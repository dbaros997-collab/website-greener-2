import fs from "node:fs";
import path from "node:path";
import { createClient, type Client } from "@libsql/client";
import { drizzle, type LibSQLDatabase } from "drizzle-orm/libsql";
import * as schema from "./schema";
import { SCHEMA_SQL } from "./schema";

type Database = LibSQLDatabase<typeof schema>;

const globalForDb = globalThis as unknown as {
  client?: Client;
  db?: Database;
  ready?: Promise<void>;
};

function databaseFile() {
  const dir = path.join(process.cwd(), "data");
  fs.mkdirSync(dir, { recursive: true });
  return path.join(dir, "grace-admin.db").replace(/\\/g, "/");
}

export function getClient() {
  if (!globalForDb.client) {
    globalForDb.client = createClient({ url: `file:${databaseFile()}` });
  }
  return globalForDb.client;
}

export function getDb() {
  if (!globalForDb.db) {
    globalForDb.db = drizzle(getClient(), { schema });
  }
  return globalForDb.db;
}

export function ensureReady() {
  if (!globalForDb.ready) {
    globalForDb.ready = (async () => {
      await getClient().executeMultiple(SCHEMA_SQL);
      const { seedIfEmpty } = await import("./seed");
      await seedIfEmpty();
    })();
  }
  return globalForDb.ready;
}
