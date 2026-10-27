import { Router, type IRouter } from "express";
import { pool } from "@workspace/db";
import { HealthCheckResponse } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/healthz", (_req, res) => {
  const data = HealthCheckResponse.parse({ status: "ok" });
  res.json(data);
});

/** Fails when Postgres is unreachable — admin saves and public live sync need the DB. */
router.get("/readyz", async (_req, res): Promise<void> => {
  try {
    await pool.query("SELECT 1");
    res.json({ status: "ok", database: "connected" });
  } catch {
    res.status(503).json({
      status: "error",
      database: "unavailable",
      hint: "Set DATABASE_URL on the server and redeploy.",
    });
  }
});

export default router;
