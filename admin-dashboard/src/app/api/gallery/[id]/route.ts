import { eq } from "drizzle-orm";
import { ensureReady, getDb } from "@/db";
import { galleryItems } from "@/db/schema";
import { describeChange, logActivity } from "@/lib/activity";
import { fail, ok, parseId, parseMerge, readJson, requireWrite } from "@/lib/http";
import { gallerySchema } from "@/lib/schemas";
import { removeUpload } from "@/lib/uploads";

export const dynamic = "force-dynamic";

async function load(id: number) {
  const rows = await getDb().select().from(galleryItems).where(eq(galleryItems.id, id));
  return rows[0] ?? null;
}

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  await ensureReady();
  const id = parseId((await ctx.params).id);
  if (!id) return fail("Unknown gallery item.", 404);
  const item = await load(id);
  if (!item) return fail("That gallery item is no longer here.", 404);
  return ok({ item });
}

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  await ensureReady();
  const gate = await requireWrite();
  if ("error" in gate) return gate.error;
  const id = parseId((await ctx.params).id);
  if (!id) return fail("Unknown gallery item.", 404);
  const existing = await load(id);
  if (!existing) return fail("That gallery item is no longer here.", 404);
  const body = await readJson(req);
  const parsed = parseMerge(gallerySchema, existing, body);
  if ("error" in parsed) return parsed.error;

  await getDb()
    .update(galleryItems)
    .set({ ...parsed.data, updatedAt: new Date().toISOString() })
    .where(eq(galleryItems.id, id));
  const item = await load(id);
  if (!item) return fail("That gallery item is no longer here.", 404);
  const summary = describeChange(
    item.title,
    body && typeof body === "object" ? (body as Record<string, unknown>) : {},
    `Updated “${item.title}”`,
  );
  await logActivity(gate.session.role, "update", "gallery", item.id, summary);
  return ok({ item });
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  await ensureReady();
  const gate = await requireWrite();
  if ("error" in gate) return gate.error;
  const id = parseId((await ctx.params).id);
  if (!id) return fail("Unknown gallery item.", 404);
  const existing = await load(id);
  if (!existing) return fail("That gallery item is no longer here.", 404);
  await getDb().delete(galleryItems).where(eq(galleryItems.id, id));
  await removeUpload(existing.mediaUrl);
  await logActivity(gate.session.role, "delete", "gallery", id, `Removed gallery item “${existing.title}”`);
  return ok({ ok: true });
}
