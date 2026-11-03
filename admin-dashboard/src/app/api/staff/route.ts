import { and, asc, eq, like, or, type SQL } from "drizzle-orm";
import { ensureReady, getDb } from "@/db";
import { staffProfiles } from "@/db/schema";
import { logActivity } from "@/lib/activity";
import { STAFF_GROUPS } from "@/lib/constants";
import { fail, ok, parseBody, readJson, requireWrite } from "@/lib/http";
import { staffSchema } from "@/lib/schemas";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  await ensureReady();
  const url = new URL(req.url);
  const q = url.searchParams.get("q")?.trim() ?? "";
  const group = url.searchParams.get("group") ?? "all";
  const department = url.searchParams.get("department") ?? "all";
  if (group !== "all" && !STAFF_GROUPS.includes(group as (typeof STAFF_GROUPS)[number])) {
    return fail("Unknown staff group.");
  }

  const filters: SQL[] = [];
  if (q) {
    const term = `%${q.replace(/[%_]/g, "")}%`;
    const match = or(
      like(staffProfiles.name, term),
      like(staffProfiles.title, term),
      like(staffProfiles.department, term),
      like(staffProfiles.bio, term),
    );
    if (match) filters.push(match);
  }
  if (group !== "all") filters.push(eq(staffProfiles.staffGroup, group));
  if (department !== "all") filters.push(eq(staffProfiles.department, department));

  const items = await getDb()
    .select()
    .from(staffProfiles)
    .where(filters.length ? and(...filters) : undefined)
    .orderBy(asc(staffProfiles.name));
  return ok({ items });
}

export async function POST(req: Request) {
  await ensureReady();
  const gate = await requireWrite();
  if ("error" in gate) return gate.error;
  const parsed = parseBody(staffSchema, await readJson(req));
  if ("error" in parsed) return parsed.error;
  const now = new Date().toISOString();
  const rows = await getDb()
    .insert(staffProfiles)
    .values({ ...parsed.data, createdAt: now, updatedAt: now })
    .returning();
  const item = rows[0];
  if (!item) return fail("Could not save the profile.", 500);
  await logActivity(gate.session.role, "create", "staff", item.id, `Added ${item.name} to the directory`);
  return ok({ item }, 201);
}
