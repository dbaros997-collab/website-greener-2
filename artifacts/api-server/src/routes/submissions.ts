import { Router, type IRouter } from "express";
import { desc, eq } from "drizzle-orm";
import { db, submissionsTable } from "@workspace/db";
import {
  CreateSubmissionBody,
  ListSubmissionsResponse,
  ListSubmissionsResponseItem,
  UpdateSubmissionBody,
} from "@workspace/api-zod";
import { requireAuth } from "../lib/auth";
import { broadcast } from "../lib/events";

const router: IRouter = Router();

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 5;
const submitHits = new Map<string, number[]>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (submitHits.get(ip) ?? []).filter(
    (t) => now - t < RATE_LIMIT_WINDOW_MS,
  );
  if (recent.length >= RATE_LIMIT_MAX) {
    submitHits.set(ip, recent);
    return true;
  }
  recent.push(now);
  submitHits.set(ip, recent);
  return false;
}

router.get("/submissions", requireAuth, async (_req, res): Promise<void> => {
  const rows = await db
    .select()
    .from(submissionsTable)
    .orderBy(desc(submissionsTable.createdAt));

  res.json(ListSubmissionsResponse.parse(rows));
});

router.post("/submissions", async (req, res): Promise<void> => {
  const ip = req.ip ?? "unknown";
  if (isRateLimited(ip)) {
    req.log.warn({ ip }, "Submission rate limit exceeded");
    res.status(429).json({ error: "Too many submissions. Please try again later." });
    return;
  }

  if (typeof req.body?.website === "string" && req.body.website.trim() !== "") {
    req.log.warn({ ip }, "Submission honeypot triggered");
    res.status(201).json({ ok: true });
    return;
  }

  const parsed = CreateSubmissionBody.safeParse(req.body);
  if (!parsed.success) {
    req.log.warn({ errors: parsed.error.message }, "Invalid submission body");
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [submission] = await db
    .insert(submissionsTable)
    .values({
      type: parsed.data.type ?? "enquiry",
      firstName: parsed.data.firstName,
      lastName: parsed.data.lastName ?? null,
      email: parsed.data.email ?? null,
      phone: parsed.data.phone ?? null,
      level: parsed.data.level ?? null,
      message: parsed.data.message ?? null,
      status: "new",
    })
    .returning();

  broadcast("submissions");
  res.status(201).json(ListSubmissionsResponseItem.parse(submission));
});

router.patch(
  "/submissions/:id",
  requireAuth,
  async (req, res): Promise<void> => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      res.status(400).json({ error: "Invalid submission id" });
      return;
    }

    const parsed = UpdateSubmissionBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }

    const [updated] = await db
      .update(submissionsTable)
      .set({ status: parsed.data.status })
      .where(eq(submissionsTable.id, id))
      .returning();

    if (!updated) {
      res.status(404).json({ error: "Submission not found" });
      return;
    }

    broadcast("submissions");
    res.json(ListSubmissionsResponseItem.parse(updated));
  },
);

router.delete(
  "/submissions/:id",
  requireAuth,
  async (req, res): Promise<void> => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      res.status(400).json({ error: "Invalid submission id" });
      return;
    }

    const [deleted] = await db
      .delete(submissionsTable)
      .where(eq(submissionsTable.id, id))
      .returning();

    if (!deleted) {
      res.status(404).json({ error: "Submission not found" });
      return;
    }

    broadcast("submissions");
    res.sendStatus(204);
  },
);

export default router;
