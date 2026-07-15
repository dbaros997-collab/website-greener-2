import { Router, type IRouter } from "express";
import { asc, count, eq } from "drizzle-orm";
import { db, resourceCategoriesTable, resourcesTable } from "@workspace/db";
import {
  CreateResourceCategoryBody,
  UpdateResourceCategoryBody,
  ListResourceCategoriesResponse,
  ListResourceCategoriesResponseItem,
  UpdateResourceCategoryParams,
  DeleteResourceCategoryParams,
} from "@workspace/api-zod";
import { requireAuth } from "../lib/auth";
import { broadcast } from "../lib/events";

const router: IRouter = Router();

const PROTECTED_SLUGS = new Set(["application_form"]);

/** Derive a URL-safe slug from a display name. */
export function slugifyCategoryName(name: string): string {
  const slug = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return slug || "folder";
}

router.get("/resource-categories", async (_req, res): Promise<void> => {
  const rows = await db
    .select()
    .from(resourceCategoriesTable)
    .orderBy(
      asc(resourceCategoriesTable.sortOrder),
      asc(resourceCategoriesTable.name),
    );

  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.json(ListResourceCategoriesResponse.parse(rows));
});

router.post(
  "/resource-categories",
  requireAuth,
  async (req, res): Promise<void> => {
    const parsed = CreateResourceCategoryBody.safeParse(req.body);
    if (!parsed.success) {
      req.log.warn({ errors: parsed.error.message }, "Invalid category body");
      res.status(400).json({ error: parsed.error.message });
      return;
    }

    const name = parsed.data.name.trim();
    const slug = (
      parsed.data.slug?.trim() || slugifyCategoryName(name)
    ).toLowerCase();
    if (!slug) {
      res.status(400).json({ error: "A valid slug is required." });
      return;
    }

    const [existing] = await db
      .select()
      .from(resourceCategoriesTable)
      .where(eq(resourceCategoriesTable.slug, slug))
      .limit(1);
    if (existing) {
      res
        .status(400)
        .json({ error: `A folder with slug "${slug}" already exists.` });
      return;
    }

    let sortOrder = parsed.data.sortOrder;
    if (sortOrder === undefined) {
      const [{ value }] = await db
        .select({ value: count() })
        .from(resourceCategoriesTable);
      sortOrder = Number(value);
    }

    const [category] = await db
      .insert(resourceCategoriesTable)
      .values({ name, slug, sortOrder })
      .returning();

    broadcast("resource-categories");
    broadcast("resources");
    res.status(201).json(ListResourceCategoriesResponseItem.parse(category));
  },
);

router.patch(
  "/resource-categories/:id",
  requireAuth,
  async (req, res): Promise<void> => {
    const params = UpdateResourceCategoryParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }

    const parsed = UpdateResourceCategoryBody.safeParse(req.body);
    if (!parsed.success) {
      req.log.warn({ errors: parsed.error.message }, "Invalid category patch");
      res.status(400).json({ error: parsed.error.message });
      return;
    }

    const patch = parsed.data;
    if (Object.keys(patch).length === 0) {
      res.status(400).json({ error: "No fields to update." });
      return;
    }

    const [existing] = await db
      .select()
      .from(resourceCategoriesTable)
      .where(eq(resourceCategoriesTable.id, params.data.id))
      .limit(1);

    if (!existing) {
      res.status(404).json({ error: "Category not found" });
      return;
    }

    const nextName =
      patch.name !== undefined ? patch.name.trim() : existing.name;
    let nextSlug =
      patch.slug !== undefined
        ? patch.slug.trim().toLowerCase()
        : existing.slug;

    if (PROTECTED_SLUGS.has(existing.slug) && nextSlug !== existing.slug) {
      res.status(400).json({
        error: `The "${existing.slug}" folder slug cannot be changed.`,
      });
      return;
    }

    if (!nextName) {
      res.status(400).json({ error: "Name cannot be empty." });
      return;
    }
    if (!nextSlug) {
      res.status(400).json({ error: "Slug cannot be empty." });
      return;
    }

    if (nextSlug !== existing.slug) {
      const [clash] = await db
        .select()
        .from(resourceCategoriesTable)
        .where(eq(resourceCategoriesTable.slug, nextSlug))
        .limit(1);
      if (clash) {
        res.status(400).json({
          error: `A folder with slug "${nextSlug}" already exists.`,
        });
        return;
      }
    }

    const [category] = await db
      .update(resourceCategoriesTable)
      .set({
        name: nextName,
        slug: nextSlug,
        ...(patch.sortOrder !== undefined
          ? { sortOrder: patch.sortOrder }
          : {}),
      })
      .where(eq(resourceCategoriesTable.id, params.data.id))
      .returning();

    // Keep denormalized category slug on files in sync when the slug changes.
    if (nextSlug !== existing.slug) {
      await db
        .update(resourcesTable)
        .set({ category: nextSlug })
        .where(eq(resourcesTable.categoryId, params.data.id));
    }

    broadcast("resource-categories");
    broadcast("resources");
    res.json(ListResourceCategoriesResponseItem.parse(category));
  },
);

router.delete(
  "/resource-categories/:id",
  requireAuth,
  async (req, res): Promise<void> => {
    const params = DeleteResourceCategoryParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }

    const [existing] = await db
      .select()
      .from(resourceCategoriesTable)
      .where(eq(resourceCategoriesTable.id, params.data.id))
      .limit(1);

    if (!existing) {
      res.status(404).json({ error: "Category not found" });
      return;
    }

    if (PROTECTED_SLUGS.has(existing.slug)) {
      res.status(400).json({
        error: "The Application Forms folder cannot be deleted.",
      });
      return;
    }

    const [{ value: fileCount }] = await db
      .select({ value: count() })
      .from(resourcesTable)
      .where(eq(resourcesTable.categoryId, params.data.id));

    if (Number(fileCount) > 0) {
      res.status(400).json({
        error:
          "This folder still has files. Move or delete them first, then remove the folder.",
      });
      return;
    }

    await db
      .delete(resourceCategoriesTable)
      .where(eq(resourceCategoriesTable.id, params.data.id));

    broadcast("resource-categories");
    broadcast("resources");
    res.sendStatus(204);
  },
);

export default router;
