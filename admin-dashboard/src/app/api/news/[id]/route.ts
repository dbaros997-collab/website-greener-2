import { eq } from "drizzle-orm";
import { ensureReady, getDb } from "@/db";
import { announcements } from "@/db/schema";
import { describeChange, logActivity } from "@/lib/activity";
import { fail, ok, parseId, parseMerge, readJson, requireWrite } from "@/lib/http";
import { announcementSchema } from "@/lib/schemas";

export const dynamic = "force-dynamic";

async function load(id: number) {
  const rows = await getDb().select().from(announcements).where(eq(announcements.id, id));
  return rows[0] ?? null;
}

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  await ensureReady();
  const id = parseId((await ctx.params).id);
  if (!id) return fail("Unknown announcement.", 404);
  const item = await load(id);
  if (!item) return fail("That announcement is no longer here.", 404);
  return ok({ item });
}

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  await ensureReady();
  const gate = await requireWrite();
  if ("error" in gate) return gate.error;
  const id = parseId((await ctx.params).id);
  if (!id) return fail("Unknown announcement.", 404);
  const existing = await load(id);
  if (!existing) return fail("That announcement is no longer here.", 404);
  const body = await readJson(req);
  const parsed = parseMerge(announcementSchema, existing, body);
  if ("error" in parsed) return parsed.error;
  await getDb()
    .update(announcements)
    .set({ ...parsed.data, updatedAt: new Date().toISOString() })
    .where(eq(announcements.id, id));
  const item = await load(id);
  if (!item) return fail("That announcement is no longer here.", 404);
  const summary = describeChange(
    item.title,
    body && typeof body === "object" ? (body as Record<string, unknown>) : {},
    `Updated “${item.title}”`,
  );
  await logActivity(gate.session.role, "update", "announcement", item.id, summary);
  return ok({ item });
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  await ensureReady();
  const gate = await requireWrite();
  if ("error" in gate) return gate.error;
  const id = parseId((await ctx.params).id);
  if (!id) return fail("Unknown announcement.", 404);
  const existing = await load(id);
  if (!existing) return fail("That announcement is no longer here.", 404);
  await getDb().delete(announcements).where(eq(announcements.id, id));
  await logActivity(gate.session.role, "delete", "announcement", id, `Removed “${existing.title}”`);
  return ok({ ok: true });
}
