import express, { type Express, type NextFunction, type Request, type Response } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import { logger } from "./lib/logger";
import { registerStaticSites } from "./lib/staticSites";

const isLocalDev =
  process.env.NODE_ENV !== "production" && process.env.REPL_ID === undefined;
const localOriginPattern = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;

function collectAllowedOrigins(): Set<string> {
  const origins = new Set<string>();

  for (const domain of (process.env.REPLIT_DOMAINS ?? "").split(",")) {
    const trimmed = domain.trim();
    if (trimmed) origins.add(`https://${trimmed}`);
  }

  for (const raw of (process.env.ALLOWED_ORIGINS ?? "").split(",")) {
    const trimmed = raw.trim();
    if (trimmed) origins.add(trimmed.replace(/\/$/, ""));
  }

  const renderUrl = process.env.RENDER_EXTERNAL_URL?.trim();
  if (renderUrl) {
    try {
      origins.add(new URL(renderUrl).origin);
    } catch {
      // ignore malformed RENDER_EXTERNAL_URL
    }
  }

  return origins;
}

const allowedOrigins = collectAllowedOrigins();

function isAllowedOrigin(origin: string): boolean {
  if (allowedOrigins.has(origin)) return true;
  if (isLocalDev && localOriginPattern.test(origin)) return true;

  try {
    const { hostname } = new URL(origin);
    if (hostname.endsWith(".onrender.com")) return true;
  } catch {
    return false;
  }

  return false;
}

function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (res.headersSent) {
    next(err);
    return;
  }
  logger.error({ err }, "Unhandled request error");
  res.status(500).json({ error: "Internal server error" });
}

/** Minimal app: logging + health + static sites. No DB imports. */
export function createBaseApp(): Express {
  const app: Express = express();
  app.set("trust proxy", 1);

  app.use(
    pinoHttp({
      logger,
      serializers: {
        req(req) {
          return {
            id: req.id,
            method: req.method,
            url: req.url?.split("?")[0],
          };
        },
        res(res) {
          return {
            statusCode: res.statusCode,
          };
        },
      },
    }),
  );

  app.get("/api/healthz", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.use(
    cors({
      credentials: true,
      origin(origin, callback) {
        if (!origin || isAllowedOrigin(origin)) {
          callback(null, true);
          return;
        }
        callback(null, false);
      },
    }),
  );
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Static sites before API so HTML is available as soon as we listen.
  // SPA fallback skips /api so later-mounted API routes still receive traffic.
  registerStaticSites(app);

  return app;
}

/** Attach API routes + sessions after the HTTP server is already listening. */
export async function mountApiRoutes(app: Express): Promise<void> {
  const [{ sessionMiddleware }, { default: router }] = await Promise.all([
    import("./lib/session"),
    import("./routes"),
  ]);

  app.use("/api", sessionMiddleware);
  app.use("/api", router);
  app.use(errorHandler);
  logger.info("API routes mounted");
}
