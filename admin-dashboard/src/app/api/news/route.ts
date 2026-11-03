import { and, desc, eq, like, or, type SQL } from "drizzle-orm";
import { ensureReady, getDb } from "@/db";
import { announcements } from "@/db/schema";
import { logActivity } from "@/lib/activity";
import { ANNOUNCEMENT_STATUSES, PRIORITIES } from "@/lib/constants";
import { fail, ok, parseBody, readJson, requireWrite } from "@/lib/http";
import { announcementSchema } from "@/lib/schemas";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  await ensureReady();
  const url = new URL(req.url);
  const q = url.searchParams.get("q")?.trim() ?? "";
  const priority = url.searchParams.get("priority") ?? "all";
  const status = url.searchParams.get("status") ?? "all";
  if (priority !== "all" && !PRIORITIES.includes(priority as (typeof PRIORITIES)[number])) {
    return fail("Unknown priority.");
  }
  if (status !== "all" && !ANNOUNCEMENT_STATUSES.includes(status as (typeof ANNOUNCEMENT_STATUSES)[number])) {
    return fail("Unknown announcement status.");
  }

  const filters: SQL[] = [];
  if (q) {
    const term = `%${q.replace(/[%_]/g, "")}%`;
    const match = or(like(announcements.title, term), like(announcements.body, term));
    if (match) filters.push(match);
  }
  if (priority !== "all") filters.push(eq(announcements.priority, priority));
  if (status !== "all") filters.push(eq(announcements.status, status));

  const items = await getDb()
    .select()
    .from(announcements)
    .where(filters.length ? and(...filters) : undefined)
    .orderBy(desc(announcements.publishAt), desc(announcements.id));
  return ok({ items });
}

export async function POST(req: Request) {
  await ensureReady();
  const gate = await requireWrite();
  if ("error" in gate) return gate.error;
  const parsed = parseBody(announcementSchema, await readJson(req));
  if ("error" in parsed) return parsed.error;
  const now = new Date().toISOString();
  const rows = await getDb()
    .insert(announcements)
    .values({ ...parsed.data, createdAt: now, updatedAt: now })
    .returning();
  const item = rows[0];
  if (!item) return fail("Could not save the announcement.", 500);
  await logActivity(gate.session.role, "create", "announcement", item.id, `Added “${item.title}”`);
  return ok({ item }, 201);
}
