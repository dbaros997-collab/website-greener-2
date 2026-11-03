import { eq } from "drizzle-orm";
import { ensureReady, getDb } from "@/db";
import { staffProfiles } from "@/db/schema";
import { describeChange, logActivity } from "@/lib/activity";
import { fail, ok, parseId, parseMerge, readJson, requireWrite } from "@/lib/http";
import { staffSchema } from "@/lib/schemas";
import { removeUpload } from "@/lib/uploads";

export const dynamic = "force-dynamic";

async function load(id: number) {
  const rows = await getDb().select().from(staffProfiles).where(eq(staffProfiles.id, id));
  return rows[0] ?? null;
}

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  await ensureReady();
  const id = parseId((await ctx.params).id);
  if (!id) return fail("Unknown profile.", 404);
  const item = await load(id);
  if (!item) return fail("That profile is no longer here.", 404);
  return ok({ item });
}

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  await ensureReady();
  const gate = await requireWrite();
  if ("error" in gate) return gate.error;
  const id = parseId((await ctx.params).id);
  if (!id) return fail("Unknown profile.", 404);
  const existing = await load(id);
  if (!existing) return fail("That profile is no longer here.", 404);
  const body = await readJson(req);
  const parsed = parseMerge(staffSchema, existing, body);
  if ("error" in parsed) return parsed.error;
  await getDb()
    .update(staffProfiles)
    .set({ ...parsed.data, updatedAt: new Date().toISOString() })
    .where(eq(staffProfiles.id, id));
  const item = await load(id);
  if (!item) return fail("That profile is no longer here.", 404);
  if (existing.photoUrl.startsWith("/uploads/") && existing.photoUrl !== item.photoUrl) {
    await removeUpload(existing.photoUrl);
  }
  const summary = describeChange(
    item.name,
    body && typeof body === "object" ? (body as Record<string, unknown>) : {},
    `Updated ${item.name}`,
  );
  await logActivity(gate.session.role, "update", "staff", item.id, summary);
  return ok({ item });
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  await ensureReady();
  const gate = await requireWrite();
  if ("error" in gate) return gate.error;
  const id = parseId((await ctx.params).id);
  if (!id) return fail("Unknown profile.", 404);
  const existing = await load(id);
  if (!existing) return fail("That profile is no longer here.", 404);
  await getDb().delete(staffProfiles).where(eq(staffProfiles.id, id));
  await removeUpload(existing.photoUrl);
  await logActivity(gate.session.role, "delete", "staff", id, `Removed ${existing.name} from the directory`);
  return ok({ ok: true });
}
