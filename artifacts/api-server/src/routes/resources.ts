import { Router, type IRouter } from "express";
import { and, desc, eq } from "drizzle-orm";
import { db, resourcesTable } from "@workspace/db";
import {
  CreateResourceBody,
  UpdateResourceBody,
  ListResourcesResponse,
  ListResourcesResponseItem,
  DeleteResourceParams,
  UpdateResourceParams,
} from "@workspace/api-zod";
import { requireAuth } from "../lib/auth";
import { broadcast } from "../lib/events";
import {
  deleteStoredObject,
  isLocalObjectStorage,
  localObjectExists,
} from "../lib/localObjectStorage";
import { resolveResourceCategory } from "../lib/resolveResourceCategory";

const router: IRouter = Router();

router.get("/resources", async (req, res): Promise<void> => {
  const category =
    typeof req.query.category === "string" ? req.query.category : undefined;
  const categoryIdRaw =
    typeof req.query.categoryId === "string" ? req.query.categoryId : undefined;
  const categoryId =
    categoryIdRaw !== undefined && categoryIdRaw !== ""
      ? Number(categoryIdRaw)
      : undefined;
  const includeHidden =
    req.query.includeHidden === "true" || req.query.includeHidden === "1";
  const showAll = includeHidden && Boolean(req.session.userId);

  const conditions = [];
  if (category) conditions.push(eq(resourcesTable.category, category));
  if (categoryId !== undefined && Number.isInteger(categoryId) && categoryId > 0) {
    conditions.push(eq(resourcesTable.categoryId, categoryId));
  }
  if (!showAll) conditions.push(eq(resourcesTable.isVisible, true));

  const rows =
    conditions.length > 0
      ? await db
          .select()
          .from(resourcesTable)
          .where(and(...conditions))
          .orderBy(desc(resourcesTable.createdAt))
      : await db
          .select()
          .from(resourcesTable)
          .orderBy(desc(resourcesTable.createdAt));

  // Never let browsers/CDNs serve a stale resource list after an admin edit.
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.json(ListResourcesResponse.parse(rows));
});

router.post("/resources", requireAuth, async (req, res): Promise<void> => {
  const parsed = CreateResourceBody.safeParse(req.body);
  if (!parsed.success) {
    req.log.warn({ errors: parsed.error.message }, "Invalid resource body");
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const resolved = await resolveResourceCategory({
    categoryId: parsed.data.categoryId,
    category: parsed.data.category,
  });
  if ("error" in resolved) {
    res.status(400).json({ error: resolved.error });
    return;
  }

  const [resource] = await db
    .insert(resourcesTable)
    .values({
      title: parsed.data.title,
      subject: parsed.data.subject,
      category: resolved.category,
      categoryId: resolved.categoryId,
      level: parsed.data.level ?? "All",
      term: parsed.data.term ?? null,
      objectPath: parsed.data.objectPath,
      fileName: parsed.data.fileName,
      fileSize: parsed.data.fileSize ?? null,
      contentType: parsed.data.contentType ?? null,
      isVisible: parsed.data.isVisible ?? true,
    })
    .returning();

  broadcast("resources");
  res.status(201).json(ListResourcesResponseItem.parse(resource));
});

router.patch("/resources/:id", requireAuth, async (req, res): Promise<void> => {
  const params = UpdateResourceParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateResourceBody.safeParse(req.body);
  if (!parsed.success) {
    req.log.warn({ errors: parsed.error.message }, "Invalid resource patch");
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
    .from(resourcesTable)
    .where(eq(resourcesTable.id, params.data.id))
    .limit(1);

  if (!existing) {
    res.status(404).json({ error: "Resource not found" });
    return;
  }

  if (
    patch.objectPath &&
    patch.objectPath !== existing.objectPath &&
    isLocalObjectStorage()
  ) {
    const ready = await localObjectExists(patch.objectPath);
    if (!ready) {
      res.status(400).json({
        error:
          "Updated file was not found in storage. Please upload the file again, then save.",
      });
      return;
    }
  }

  let categoryFields: { category?: string; categoryId?: number | null } = {};
  if (patch.categoryId !== undefined || patch.category !== undefined) {
    const resolved = await resolveResourceCategory({
      categoryId: patch.categoryId,
      category: patch.category,
    });
    if ("error" in resolved) {
      res.status(400).json({ error: resolved.error });
      return;
    }
    categoryFields = {
      category: resolved.category,
      categoryId: resolved.categoryId,
    };
  }

  const [resource] = await db
    .update(resourcesTable)
    .set({
      ...(patch.title !== undefined ? { title: patch.title } : {}),
      ...(patch.subject !== undefined ? { subject: patch.subject } : {}),
      ...categoryFields,
      ...(patch.level !== undefined ? { level: patch.level } : {}),
      ...(patch.term !== undefined ? { term: patch.term } : {}),
      ...(patch.objectPath !== undefined ? { objectPath: patch.objectPath } : {}),
      ...(patch.fileName !== undefined ? { fileName: patch.fileName } : {}),
      ...(patch.fileSize !== undefined ? { fileSize: patch.fileSize } : {}),
      ...(patch.contentType !== undefined
        ? { contentType: patch.contentType }
        : {}),
      ...(patch.isVisible !== undefined ? { isVisible: patch.isVisible } : {}),
    })
    .where(eq(resourcesTable.id, params.data.id))
    .returning();

  if (!resource) {
    res.status(404).json({ error: "Resource not found" });
    return;
  }

  if (patch.objectPath && patch.objectPath !== existing.objectPath) {
    try {
      await deleteStoredObject(existing.objectPath);
    } catch (error) {
      req.log.error(
        { err: error, objectPath: existing.objectPath },
        "Updated resource but failed to remove previous stored file",
      );
    }
  }

  broadcast("resources");
  res.json(ListResourcesResponseItem.parse(resource));
});

router.delete("/resources/:id", requireAuth, async (req, res): Promise<void> => {
  const params = DeleteResourceParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [deleted] = await db
    .delete(resourcesTable)
    .where(eq(resourcesTable.id, params.data.id))
    .returning();

  if (!deleted) {
    res.status(404).json({ error: "Resource not found" });
    return;
  }

  try {
    await deleteStoredObject(deleted.objectPath);
  } catch (error) {
    req.log.error(
      { err: error, objectPath: deleted.objectPath },
      "Deleted resource record but failed to remove stored file",
    );
  }

  broadcast("resources");
  res.sendStatus(204);
});

export default router;
