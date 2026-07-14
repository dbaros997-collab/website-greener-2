import { randomUUID } from "node:crypto";
import { createReadStream, existsSync } from "node:fs";
import { mkdir, unlink, writeFile, stat } from "node:fs/promises";
import path from "node:path";
import type { Request, Response } from "express";

export type LocalUploadPrefix = "uploads" | "applications";

interface PendingUpload {
  objectId: string;
  prefix: LocalUploadPrefix;
  expiresAt: number;
}

const pending = new Map<string, PendingUpload>();
const TOKEN_TTL_MS = 15 * 60 * 1000;

/** True when Replit/GCS object storage is not configured — use local disk. */
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

export async function ensureLocalUploadDirs(): Promise<void> {
  const root = getLocalUploadRoot();
  await mkdir(path.join(root, "uploads"), { recursive: true });
  await mkdir(path.join(root, "applications"), { recursive: true });
}

export function createLocalUpload(
  prefix: LocalUploadPrefix,
  req?: Request,
): { uploadURL: string; objectPath: string } {
  const objectId = randomUUID();
  const token = randomUUID();
  pending.set(token, {
    objectId,
    prefix,
    expiresAt: Date.now() + TOKEN_TTL_MS,
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

  await ensureLocalUploadDirs();
  const filePath = absoluteFilePath(entry.prefix, entry.objectId);
  await writeFile(filePath, body);
  pending.delete(token);

  res.status(200).json({ ok: true });
}

export async function serveLocalObject(
  objectPath: string,
  res: Response,
): Promise<boolean> {
  const parsed = parseObjectPath(objectPath);
  if (!parsed) return false;

  const filePath = absoluteFilePath(parsed.prefix, parsed.objectId);
  if (!existsSync(filePath)) return false;

  const info = await stat(filePath);
  res.setHeader("Content-Type", "application/octet-stream");
  res.setHeader("Content-Length", String(info.size));
  res.setHeader("Cache-Control", "public, max-age=3600");
  createReadStream(filePath).pipe(res);
  return true;
}

export async function deleteLocalObject(objectPath: string): Promise<void> {
  const parsed = parseObjectPath(objectPath);
  if (!parsed) return;
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
