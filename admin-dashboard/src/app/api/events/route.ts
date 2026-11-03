import { and, asc, eq, like, or, type SQL } from "drizzle-orm";
import { ensureReady, getDb } from "@/db";
import { schoolEvents } from "@/db/schema";
import { logActivity } from "@/lib/activity";
import { AUDIENCES, EVENT_STATUSES, EVENT_TYPES } from "@/lib/constants";
import { fail, ok, parseBody, readJson, requireWrite } from "@/lib/http";
import { eventSchema } from "@/lib/schemas";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  await ensureReady();
  const url = new URL(req.url);
  const q = url.searchParams.get("q")?.trim() ?? "";
  const eventType = url.searchParams.get("type") ?? "all";
  const audience = url.searchParams.get("audience") ?? "all";
  const status = url.searchParams.get("status") ?? "all";
  if (eventType !== "all" && !EVENT_TYPES.includes(eventType as (typeof EVENT_TYPES)[number])) {
    return fail("Unknown event type.");
  }
  if (audience !== "all" && !AUDIENCES.includes(audience as (typeof AUDIENCES)[number])) {
    return fail("Unknown audience.");
  }
  if (status !== "all" && !EVENT_STATUSES.includes(status as (typeof EVENT_STATUSES)[number])) {
    return fail("Unknown event status.");
  }

  const filters: SQL[] = [];
  if (q) {
    const term = `%${q.replace(/[%_]/g, "")}%`;
    const match = or(like(schoolEvents.title, term), like(schoolEvents.venue, term), like(schoolEvents.description, term));
    if (match) filters.push(match);
  }
  if (eventType !== "all") filters.push(eq(schoolEvents.eventType, eventType));
  if (status !== "all") filters.push(eq(schoolEvents.status, status));

  let items = await getDb()
    .select()
    .from(schoolEvents)
    .where(filters.length ? and(...filters) : undefined)
    .orderBy(asc(schoolEvents.startsAt));

  if (audience !== "all") {
    items = items.filter((item) => item.audiences.includes(audience as (typeof AUDIENCES)[number]));
  }
  return ok({ items });
}

export async function POST(req: Request) {
  await ensureReady();
  const gate = await requireWrite();
  if ("error" in gate) return gate.error;
  const parsed = parseBody(eventSchema, await readJson(req));
  if ("error" in parsed) return parsed.error;
  const now = new Date().toISOString();
  const rows = await getDb()
    .insert(schoolEvents)
    .values({ ...parsed.data, createdAt: now, updatedAt: now })
    .returning();
  const item = rows[0];
  if (!item) return fail("Could not save the event.", 500);
  await logActivity(gate.session.role, "create", "event", item.id, `Scheduled “${item.title}”`);
  return ok({ item }, 201);
}
