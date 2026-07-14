import { randomUUID } from "node:crypto";
import { createReadStream, existsSync } from "node:fs";
import { mkdir, unlink, writeFile, stat } from "node:fs/promises";
import path from "node:path";
import type { Request, Response } from "express";
import { pool } from "@workspace/db";

export type LocalUploadPrefix = "uploads" | "applications";

interface PendingUpload {
  objectId: string;
  prefix: LocalUploadPrefix;
  expiresAt: number;
  contentType: string;
  fileName: string;
}

const pending = new Map<string, PendingUpload>();
const TOKEN_TTL_MS = 15 * 60 * 1000;

/** True when Replit/GCS object storage is not configured — use DB (+ optional disk). */
export function isLocalObjectStorage(): boolean {
  return !process.env.PRIVATE_OBJECT_DIR?.trim();
}

export function getLocalUploadRoot(): string {
  const configured = process.env.LOCAL_UPLOAD_DIR?.trim();
  if (configured) return path.resolve(configured);
  return path.resolve(process.cwd(), ".local", "uploads");
}

function absoluteFilePath(prefix: LocalUploadPrefix, objectId: string): string {
  return path.join(getLocalUploadRoot(), prefix, objectId);
}

function objectPathFor(prefix: LocalUploadPrefix, objectId: string): string {
  return `/objects/${prefix}/${objectId}`;
}

function parseObjectPath(objectPath: string): {
  prefix: LocalUploadPrefix;
  objectId: string;
} | null {
  const match = objectPath.match(/^\/objects\/(uploads|applications)\/([^/]+)$/);
  if (!match) return null;
  return {
    prefix: match[1] as LocalUploadPrefix,
    objectId: match[2]!,
  };
}

function guessContentType(fileName: string, fallback: string): string {
  const lower = fileName.toLowerCase();
  if (lower.endsWith(".pdf")) return "application/pdf";
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".doc")) return "application/msword";
  if (lower.endsWith(".docx")) {
    return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  }
  return fallback || "application/octet-stream";
}

function contentDisposition(fileName: string, contentType: string): string {
  const safe = fileName.replace(/["\r\n]/g, "_") || "download";
  const inline =
    contentType.startsWith("image/") || contentType === "application/pdf";
  return `${inline ? "inline" : "attachment"}; filename="${safe}"`;
}

export async function ensureLocalUploadDirs(): Promise<void> {
  const root = getLocalUploadRoot();
  await mkdir(path.join(root, "uploads"), { recursive: true });
  await mkdir(path.join(root, "applications"), { recursive: true });
}

async function upsertStoredObject(args: {
  objectPath: string;
  contentType: string;
  fileName: string;
  body: Buffer;
}): Promise<void> {
  await pool.query(
    `INSERT INTO stored_objects (object_path, content_type, file_name, byte_size, data)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (object_path) DO UPDATE SET
       content_type = EXCLUDED.content_type,
       file_name = EXCLUDED.file_name,
       byte_size = EXCLUDED.byte_size,
       data = EXCLUDED.data,
       created_at = now()`,
    [
      args.objectPath,
      args.contentType,
      args.fileName,
      args.body.length,
      args.body,
    ],
  );
}

async function readStoredObject(objectPath: string): Promise<{
  contentType: string;
  fileName: string;
  data: Buffer;
} | null> {
  const result = await pool.query<{
    content_type: string;
    file_name: string;
    data: Buffer;
  }>(
    `SELECT content_type, file_name, data
     FROM stored_objects
     WHERE object_path = $1
     LIMIT 1`,
    [objectPath],
  );
  const row = result.rows[0];
  if (!row) return null;
  return {
    contentType: row.content_type,
    fileName: row.file_name,
    data: row.data,
  };
}

async function deleteStoredObjectRow(objectPath: string): Promise<void> {
  await pool.query(`DELETE FROM stored_objects WHERE object_path = $1`, [
    objectPath,
  ]);
}

/** True when the blob exists in Postgres or on disk. */
export async function localObjectExists(objectPath: string): Promise<boolean> {
  const parsed = parseObjectPath(objectPath);
  if (!parsed) return false;

  const dbHit = await pool.query(
    `SELECT 1 FROM stored_objects WHERE object_path = $1 LIMIT 1`,
    [objectPath],
  );
  if ((dbHit.rowCount ?? 0) > 0) return true;

  return existsSync(absoluteFilePath(parsed.prefix, parsed.objectId));
}

export function createLocalUpload(
  prefix: LocalUploadPrefix,
  req?: Request,
  meta?: { contentType?: string; fileName?: string },
): { uploadURL: string; objectPath: string } {
  const objectId = randomUUID();
  const token = randomUUID();
  const fileName = meta?.fileName?.trim() || objectId;
  const contentType = guessContentType(
    fileName,
    meta?.contentType?.trim() || "application/octet-stream",
  );

  pending.set(token, {
    objectId,
    prefix,
    expiresAt: Date.now() + TOKEN_TTL_MS,
    contentType,
    fileName,
  });

  // Prefer the browser Origin so Vite-proxied admin/site keep a same-origin URL
  // (required by the OpenAPI `format: uri` response schema).
  let origin = "";
  const rawOrigin = req?.get("origin") ?? "";
  if (rawOrigin) {
    try {
      origin = new URL(rawOrigin).origin;
    } catch {
      origin = "";
    }
  }
  if (!origin) {
    const host = req?.get("x-forwarded-host") ?? req?.get("host") ?? "localhost:8080";
    const protoHeader = req?.get("x-forwarded-proto");
    const proto = (protoHeader ?? req?.protocol ?? "http").split(",")[0]!.trim();
    origin = `${proto}://${host}`;
  }

  return {
    uploadURL: `${origin}/api/storage/local-upload/${token}`,
    objectPath: objectPathFor(prefix, objectId),
  };
}

export async function handleLocalUploadPut(
  req: Request,
  res: Response,
  token: string,
): Promise<void> {
  const entry = pending.get(token);
  if (!entry || entry.expiresAt < Date.now()) {
    pending.delete(token);
    res.status(404).json({ error: "Upload URL expired or invalid" });
    return;
  }

  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  const body = Buffer.concat(chunks);
  if (body.length === 0) {
    res.status(400).json({ error: "Empty upload body" });
    return;
  }

  const headerType = req.get("content-type")?.split(";")[0]?.trim();
  const contentType = guessContentType(
    entry.fileName,
    headerType && headerType !== "application/octet-stream"
      ? headerType
      : entry.contentType,
  );
  const objectPath = objectPathFor(entry.prefix, entry.objectId);

  // Durable primary store (survives Render restarts). Disk is a local cache.
  await upsertStoredObject({
    objectPath,
    contentType,
    fileName: entry.fileName,
    body,
  });

  try {
    await ensureLocalUploadDirs();
    await writeFile(absoluteFilePath(entry.prefix, entry.objectId), body);
  } catch {
    // Disk is optional; Postgres already has the file.
  }

  pending.delete(token);
  res.status(200).json({ ok: true });
}

export async function serveLocalObject(
  objectPath: string,
  res: Response,
): Promise<boolean> {
  const parsed = parseObjectPath(objectPath);
  if (!parsed) return false;

  const fromDb = await readStoredObject(objectPath);
  if (fromDb) {
    res.setHeader("Content-Type", fromDb.contentType);
    res.setHeader("Content-Length", String(fromDb.data.length));
    res.setHeader(
      "Content-Disposition",
      contentDisposition(fromDb.fileName, fromDb.contentType),
    );
    // Avoid stale cached 404s after a replace/redeploy.
    res.setHeader("Cache-Control", "private, no-cache, must-revalidate");
    res.send(fromDb.data);
    return true;
  }

  const filePath = absoluteFilePath(parsed.prefix, parsed.objectId);
  if (!existsSync(filePath)) return false;

  const info = await stat(filePath);
  const contentType = "application/octet-stream";
  res.setHeader("Content-Type", contentType);
  res.setHeader("Content-Length", String(info.size));
  res.setHeader(
    "Content-Disposition",
    contentDisposition(parsed.objectId, contentType),
  );
  res.setHeader("Cache-Control", "private, no-cache, must-revalidate");
  createReadStream(filePath).pipe(res);
  return true;
}

export async function deleteLocalObject(objectPath: string): Promise<void> {
  const parsed = parseObjectPath(objectPath);
  if (!parsed) return;

  try {
    await deleteStoredObjectRow(objectPath);
  } catch {
    // Table may not exist yet on a very early boot — ignore.
  }

  const filePath = absoluteFilePath(parsed.prefix, parsed.objectId);
  try {
    await unlink(filePath);
  } catch (err) {
    const code = (err as NodeJS.ErrnoException).code;
    if (code !== "ENOENT") throw err;
  }
}

export async function deleteStoredObject(objectPath: string): Promise<void> {
  if (isLocalObjectStorage()) {
    await deleteLocalObject(objectPath);
    return;
  }
  const { ObjectStorageService } = await import("./objectStorage");
  const service = new ObjectStorageService();
  await service.deleteObjectEntity(objectPath);
}
