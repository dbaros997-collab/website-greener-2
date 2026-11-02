import { mkdir } from "node:fs/promises";
import path from "node:path";
import { Router, type IRouter, type Request, type Response } from "express";
import { logger } from "../lib/logger";
import { Readable } from "stream";
import {
  RequestUploadUrlBody,
  RequestUploadUrlResponse,
} from "@workspace/api-zod";
import { requireAuth } from "../lib/auth";
import { MultipartError, readMultipartRequest } from "../lib/multipart";
import {
  createLocalUpload,
  ensureLocalUploadDirs,
  handleLocalUploadPut,
  isLocalObjectStorage,
  saveLocalObjectBytes,
  serveLocalObject,
} from "../lib/localObjectStorage";
import {
  DATABASE_UNAVAILABLE_MESSAGE,
  isPostgresConnectionError,
} from "../lib/pg-errors";

const router: IRouter = Router();

type CloudStorageModule = typeof import("../lib/objectStorage");

let cloudStorageModule: CloudStorageModule | null = null;

async function loadCloudStorage(): Promise<CloudStorageModule> {
  if (!cloudStorageModule) {
    cloudStorageModule = await import("../lib/objectStorage");
  }
  return cloudStorageModule;
}

async function cloudStorageService() {
  const mod = await loadCloudStorage();
  return new mod.ObjectStorageService();
}

/**
 * PUT /storage/local-upload/:token
 * Receives the file body for local-disk uploads (when PRIVATE_OBJECT_DIR is unset).
 */
router.put("/storage/local-upload/:token", async (req: Request, res: Response) => {
  const token = typeof req.params.token === "string" ? req.params.token : "";
  if (!token) {
    res.status(400).json({ error: "Missing upload token" });
    return;
  }
  try {
    await handleLocalUploadPut(req, res, token);
  } catch (error) {
    req.log.error({ err: error }, "Error writing local upload");
    if (!res.headersSent) {
      res.status(500).json({ error: "Failed to store upload" });
    }
  }
});

const APP_UPLOAD_WINDOW_MS = 60_000;
const APP_UPLOAD_MAX = 8;
const appUploadHits = new Map<string, number[]>();

function isAppUploadRateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (appUploadHits.get(ip) ?? []).filter(
    (t) => now - t < APP_UPLOAD_WINDOW_MS,
  );
  if (recent.length >= APP_UPLOAD_MAX) {
    appUploadHits.set(ip, recent);
    return true;
  }
  recent.push(now);
  appUploadHits.set(ip, recent);
  return false;
}

const ALLOWED_APP_UPLOAD_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);
const MAX_APP_UPLOAD_BYTES = 15 * 1024 * 1024;

/**
 * POST /storage/application-uploads/request-url
 *
 * Public (no auth) presigned-upload for prospective students submitting their
 * completed S1/S5 application form. Rate-limited per IP and restricted to common
 * document/image types and a max size.
 */
router.post(
  "/storage/application-uploads/request-url",
  async (req: Request, res: Response) => {
    const ip = req.ip ?? "unknown";
    if (isAppUploadRateLimited(ip)) {
      req.log.warn({ ip }, "Application upload rate limit exceeded");
      res
        .status(429)
        .json({ error: "Too many uploads. Please try again in a minute." });
      return;
    }

    const parsed = RequestUploadUrlBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Missing or invalid required fields" });
      return;
    }

    const { name, size, contentType } = parsed.data;
    if (!ALLOWED_APP_UPLOAD_TYPES.has(contentType)) {
      res.status(400).json({
        error: "Unsupported file type. Please upload a PDF, image, or Word document.",
      });
      return;
    }
    if (size > MAX_APP_UPLOAD_BYTES) {
      res
        .status(400)
        .json({ error: "File is too large. Maximum size is 15 MB." });
      return;
    }

    try {
      if (isLocalObjectStorage()) {
        const local = createLocalUpload("applications", req, {
          contentType,
          fileName: name,
        });
        res.json(
          RequestUploadUrlResponse.parse({
            uploadURL: local.uploadURL,
            objectPath: local.objectPath,
            metadata: { name, size, contentType },
          }),
        );
        return;
      }

      const objectStorageService = await cloudStorageService();
      const uploadURL = await objectStorageService.getApplicationUploadURL();
      const objectPath = objectStorageService.normalizeObjectEntityPath(uploadURL);
      res.json(
        RequestUploadUrlResponse.parse({
          uploadURL,
          objectPath,
          metadata: { name, size, contentType },
        }),
      );
    } catch (error) {
      req.log.error({ err: error }, "Error generating application upload URL");
      res.status(500).json({ error: "Failed to generate upload URL" });
    }
  },
);

const MAX_IMAGE_UPLOAD_BYTES = 15 * 1024 * 1024;
const IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp", ".gif", ".heic", ".avif"];

function isImageUpload(fileName: string, contentType: string): boolean {
  const type = contentType.toLowerCase().split(";")[0]?.trim() ?? "";
  if (type.startsWith("image/")) return true;
  const lower = fileName.toLowerCase();
  return IMAGE_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

async function storeImageUpload(args: {
  fileName: string;
  contentType: string;
  body: Buffer;
}): Promise<string> {
  if (!isLocalObjectStorage()) {
    try {
      const service = await cloudStorageService();
      return await service.saveUploadedBytes({
        prefix: "uploads",
        contentType: args.contentType,
        body: args.body,
      });
    } catch (error) {
      logger.warn(
        { err: error },
        "Cloud image upload failed; storing the file in the database",
      );
    }
  }

  return saveLocalObjectBytes({
    prefix: "uploads",
    fileName: args.fileName,
    contentType: args.contentType,
    body: args.body,
  });
}

/**
 * POST /storage/uploads
 *
 * Multipart image upload used by the gallery form. The client must send
 * FormData and must NOT set Content-Type (the browser adds the boundary).
 */
router.post("/storage/uploads", requireAuth, async (req: Request, res: Response) => {
  try {
    const form = await readMultipartRequest(req, MAX_IMAGE_UPLOAD_BYTES);
    const file =
      form.files.find((item) => item.fieldName === "file" || item.fieldName === "image") ??
      form.files[0];
    if (!file || file.data.length === 0) {
      res.status(400).json({ error: "Choose an image file to upload." });
      return;
    }
    if (!isImageUpload(file.fileName, file.contentType)) {
      res.status(400).json({
        error: "Unsupported file type. Please upload a JPEG, PNG, or WebP image.",
      });
      return;
    }

    const uploadDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadDir, { recursive: true });
    await ensureLocalUploadDirs();

    const objectPath = await storeImageUpload({
      fileName: file.fileName,
      contentType: file.contentType,
      body: file.data,
    });
    res.status(201).json({
      objectPath,
      metadata: {
        name: file.fileName,
        size: file.data.length,
        contentType: file.contentType || "application/octet-stream",
      },
    });
  } catch (error) {
    console.error("Gallery Upload Error:", error);
    if (error instanceof MultipartError) {
      res.status(error.status).json({ error: error.message });
      return;
    }
    if (isPostgresConnectionError(error)) {
      res.status(503).json({ error: DATABASE_UNAVAILABLE_MESSAGE });
      return;
    }
    req.log.error({ err: error }, "Error storing multipart image upload");
    res.status(500).json({ error: "Failed to store upload" });
  }
});

/**
 * POST /storage/uploads/request-url
 *
 * Request a presigned URL for file upload.
 * The client sends JSON metadata (name, size, contentType) — NOT the file.
 * Then uploads the file directly to the returned presigned URL.
 */
router.post("/storage/uploads/request-url", requireAuth, async (req: Request, res: Response) => {
  const parsed = RequestUploadUrlBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Missing or invalid required fields" });
    return;
  }

  try {
    const { name, size, contentType } = parsed.data;

    if (isLocalObjectStorage()) {
      const local = createLocalUpload("uploads", req, {
        contentType,
        fileName: name,
      });
      res.json(
        RequestUploadUrlResponse.parse({
          uploadURL: local.uploadURL,
          objectPath: local.objectPath,
          metadata: { name, size, contentType },
        }),
      );
      return;
    }

    const objectStorageService = await cloudStorageService();
    const uploadURL = await objectStorageService.getObjectEntityUploadURL();
    const objectPath = objectStorageService.normalizeObjectEntityPath(uploadURL);

    res.json(
      RequestUploadUrlResponse.parse({
        uploadURL,
        objectPath,
        metadata: { name, size, contentType },
      }),
    );
  } catch (error) {
    req.log.error({ err: error }, "Error generating upload URL");
    res.status(500).json({ error: "Failed to generate upload URL" });
  }
});

/**
 * GET /storage/public-objects/*
 *
 * Serve public assets from PUBLIC_OBJECT_SEARCH_PATHS.
 * These are unconditionally public — no authentication or ACL checks.
 * IMPORTANT: Always provide this endpoint when object storage is set up.
 */
router.get("/storage/public-objects/*filePath", async (req: Request, res: Response) => {
  if (isLocalObjectStorage()) {
    res.status(404).json({ error: "File not found" });
    return;
  }

  try {
    const objectStorageService = await cloudStorageService();
    const raw = req.params.filePath;
    const filePath = Array.isArray(raw) ? raw.join("/") : raw;
    const file = await objectStorageService.searchPublicObject(filePath);
    if (!file) {
      res.status(404).json({ error: "File not found" });
      return;
    }

    const response = await objectStorageService.downloadObject(file);

    res.status(response.status);
    response.headers.forEach((value, key) => res.setHeader(key, value));

    if (response.body) {
      const nodeStream = Readable.fromWeb(response.body as ReadableStream<Uint8Array>);
      nodeStream.pipe(res);
    } else {
      res.end();
    }
  } catch (error) {
    req.log.error({ err: error }, "Error serving public object");
    res.status(500).json({ error: "Failed to serve public object" });
  }
});

/**
 * GET /storage/objects/*
 *
 * Serve object entities from PRIVATE_OBJECT_DIR.
 * These are served from a separate path from /public-objects and can optionally
 * be protected with authentication or ACL checks based on the use case.
 */
router.get("/storage/objects/*path", async (req: Request, res: Response) => {
  try {
    const raw = req.params.path;
    const wildcardPath = Array.isArray(raw) ? raw.join("/") : raw;

    // Application-form uploads contain applicant PII — staff-only.
    if (wildcardPath.startsWith("applications/") && !req.session.userId) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }

    const objectPath = `/objects/${wildcardPath}`;

    // Database copies are checked first so gallery images saved with the
    // multipart upload still load when cloud storage is not configured.
    const served = await serveLocalObject(objectPath, res);
    if (served) return;

    if (isLocalObjectStorage()) {
      res.status(404).json({ error: "Object not found" });
      return;
    }

    const objectStorageService = await cloudStorageService();
    const objectFile = await objectStorageService.getObjectEntityFile(objectPath);

    const response = await objectStorageService.downloadObject(objectFile);

    res.status(response.status);
    response.headers.forEach((value, key) => res.setHeader(key, value));

    if (response.body) {
      const nodeStream = Readable.fromWeb(response.body as ReadableStream<Uint8Array>);
      nodeStream.pipe(res);
    } else {
      res.end();
    }
  } catch (error) {
    const mod = await loadCloudStorage().catch(() => null);
    if (mod && error instanceof mod.ObjectNotFoundError) {
      req.log.warn({ err: error }, "Object not found");
      res.status(404).json({ error: "Object not found" });
      return;
    }
    req.log.error({ err: error }, "Error serving object");
    res.status(500).json({ error: "Failed to serve object" });
  }
});

export default router;
