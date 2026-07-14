import { Router, type IRouter, type Request, type Response } from "express";
import { Readable } from "stream";
import {
  RequestUploadUrlBody,
  RequestUploadUrlResponse,
} from "@workspace/api-zod";
import { ObjectStorageService, ObjectNotFoundError } from "../lib/objectStorage";
import { ObjectPermission } from "../lib/objectAcl";
import { requireAuth } from "../lib/auth";
import {
  createLocalUpload,
  handleLocalUploadPut,
  isLocalObjectStorage,
  serveLocalObject,
} from "../lib/localObjectStorage";

const router: IRouter = Router();
const objectStorageService = new ObjectStorageService();

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
        const local = createLocalUpload("applications", req);
        res.json(
          RequestUploadUrlResponse.parse({
            uploadURL: local.uploadURL,
            objectPath: local.objectPath,
            metadata: { name, size, contentType },
          }),
        );
        return;
      }

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
      const local = createLocalUpload("uploads", req);
      res.json(
        RequestUploadUrlResponse.parse({
          uploadURL: local.uploadURL,
          objectPath: local.objectPath,
          metadata: { name, size, contentType },
        }),
      );
      return;
    }

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
  try {
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

    if (isLocalObjectStorage()) {
      const served = await serveLocalObject(objectPath, res);
      if (!served) {
        res.status(404).json({ error: "Object not found" });
      }
      return;
    }

    const objectFile = await objectStorageService.getObjectEntityFile(objectPath);

    // --- Protected route example (uncomment when using replit-auth) ---
    // if (!req.isAuthenticated()) {
    //   res.status(401).json({ error: "Unauthorized" });
    //   return;
    // }
    // const canAccess = await objectStorageService.canAccessObjectEntity({
    //   userId: req.user.id,
    //   objectFile,
    //   requestedPermission: ObjectPermission.READ,
    // });
    // if (!canAccess) {
    //   res.status(403).json({ error: "Forbidden" });
    //   return;
    // }

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
    if (error instanceof ObjectNotFoundError) {
      req.log.warn({ err: error }, "Object not found");
      res.status(404).json({ error: "Object not found" });
      return;
    }
    req.log.error({ err: error }, "Error serving object");
    res.status(500).json({ error: "Failed to serve object" });
  }
});

export default router;
