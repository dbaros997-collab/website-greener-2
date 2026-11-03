import { and, desc, eq, like, or, type SQL } from "drizzle-orm";
import { ensureReady, getDb } from "@/db";
import { galleryItems } from "@/db/schema";
import { describeChange, logActivity } from "@/lib/activity";
import { GALLERY_CATEGORIES, GALLERY_STATUSES } from "@/lib/constants";
import { fail, ok, parseBody, readJson, requireWrite } from "@/lib/http";
import { gallerySchema } from "@/lib/schemas";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  await ensureReady();
  const url = new URL(req.url);
  const q = url.searchParams.get("q")?.trim() ?? "";
  const category = url.searchParams.get("category") ?? "all";
  const status = url.searchParams.get("status") ?? "all";
  if (category !== "all" && !GALLERY_CATEGORIES.includes(category as (typeof GALLERY_CATEGORIES)[number])) {
    return fail("Unknown gallery category.");
  }
  if (status !== "all" && !GALLERY_STATUSES.includes(status as (typeof GALLERY_STATUSES)[number])) {
    return fail("Unknown gallery status.");
  }

  const filters: SQL[] = [];
  if (q) {
    const term = `%${q.replace(/[%_]/g, "")}%`;
    const match = or(like(galleryItems.title, term), like(galleryItems.description, term));
    if (match) filters.push(match);
  }
  if (category !== "all") filters.push(eq(galleryItems.category, category));
  if (status !== "all") filters.push(eq(galleryItems.status, status));

  const items = await getDb()
    .select()
    .from(galleryItems)
    .where(filters.length ? and(...filters) : undefined)
    .orderBy(desc(galleryItems.featured), desc(galleryItems.takenOn), desc(galleryItems.id));

  return ok({ items });
}

export async function POST(req: Request) {
  await ensureReady();
  const gate = await requireWrite();
  if ("error" in gate) return gate.error;
  const parsed = parseBody(gallerySchema, await readJson(req));
  if ("error" in parsed) return parsed.error;

  const now = new Date().toISOString();
  const rows = await getDb()
    .insert(galleryItems)
    .values({ ...parsed.data, createdAt: now, updatedAt: now })
    .returning();
  const item = rows[0];
  if (!item) return fail("Could not save the gallery item.", 500);
  await logActivity(gate.session.role, "create", "gallery", item.id, `Added gallery item “${item.title}”`);
  return ok({ item }, 201);
}
