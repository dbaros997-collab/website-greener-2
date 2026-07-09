import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import { sessionMiddleware } from "./lib/session";
import { logger } from "./lib/logger";

const app: Express = express();

// The shared Replit proxy terminates TLS in front of this server, so trust it
// for secure-cookie and protocol detection.
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
// Lock CORS down to this deployment's own domains. Admin and public are both
// served same-origin through the shared proxy, so no third-party origin needs
// credentialed access; requests with no Origin header (curl, same-origin) pass.
const isLocalDev =
  process.env.NODE_ENV !== "production" && process.env.REPL_ID === undefined;
const allowedOrigins = (process.env.REPLIT_DOMAINS ?? "")
  .split(",")
  .map((d) => d.trim())
  .filter(Boolean)
  .map((d) => `https://${d}`);
const localOriginPattern = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;

app.use(
  cors({
    credentials: true,
    origin(origin, callback) {
      if (
        !origin ||
        allowedOrigins.includes(origin) ||
        (isLocalDev && localOriginPattern.test(origin))
      ) {
        callback(null, true);
        return;
      }
      callback(new Error("Not allowed by CORS"));
    },
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(sessionMiddleware);

app.use("/api", router);

export default app;
