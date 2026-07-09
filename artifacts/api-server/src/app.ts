import express, { type Express, type NextFunction, type Request, type Response } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import healthRouter from "./routes/health";
import { sessionMiddleware } from "./lib/session";
import { logger } from "./lib/logger";
import { registerStaticSites } from "./lib/staticSites";

const app: Express = express();

// Proxies (Render / Replit) terminate TLS in front of this server.
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

// Health checks must not depend on CORS, sessions, or the DB store.
app.use("/api", healthRouter);

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

  // Same-origin Render deploys (and PR previews) send this Origin on API calls.
  try {
    const { hostname } = new URL(origin);
    if (hostname.endsWith(".onrender.com")) return true;
  } catch {
    return false;
  }

  return false;
}

app.use(
  cors({
    credentials: true,
    origin(origin, callback) {
      // Never throw — cors errors become 500s and break the public site.
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

// Sessions are only needed for API auth — keep them off static HTML/JS so a
// slow or cold Postgres connection cannot blank the public site.
app.use("/api", sessionMiddleware);
app.use("/api", router);

registerStaticSites(app);

app.use((err: unknown, _req: Request, res: Response, next: NextFunction) => {
  if (res.headersSent) {
    next(err);
    return;
  }
  logger.error({ err }, "Unhandled request error");
  res.status(500).json({ error: "Internal server error" });
});

export default app;
