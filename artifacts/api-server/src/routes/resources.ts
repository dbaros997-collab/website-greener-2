import { Router, type IRouter } from "express";
import { desc, eq } from "drizzle-orm";
import { db, resourcesTable } from "@workspace/db";
import {
  CreateResourceBody,
  ListResourcesResponse,
  ListResourcesResponseItem,
  DeleteResourceParams,
} from "@workspace/api-zod";
import { ObjectStorageService } from "../lib/objectStorage";

const router: IRouter = Router();
const objectStorageService = new ObjectStorageService();

router.get("/resources", async (req, res): Promise<void> => {
  const category =
    typeof req.query.category === "string" ? req.query.category : undefined;

  const rows = category
    ? await db
        .select()
        .from(resourcesTable)
        .where(eq(resourcesTable.category, category))
        .orderBy(desc(resourcesTable.createdAt))
    : await db
        .select()
        .from(resourcesTable)
        .orderBy(desc(resourcesTable.createdAt));

  res.json(ListResourcesResponse.parse(rows));
});

router.post("/resources", async (req, res): Promise<void> => {
  const parsed = CreateResourceBody.safeParse(req.body);
  if (!parsed.success) {
    req.log.warn({ errors: parsed.error.message }, "Invalid resource body");
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [resource] = await db
    .insert(resourcesTable)
    .values({
      title: parsed.data.title,
      subject: parsed.data.subject,
      category: parsed.data.category,
      level: parsed.data.level ?? "All",
      term: parsed.data.term ?? null,
      objectPath: parsed.data.objectPath,
      fileName: parsed.data.fileName,
      fileSize: parsed.data.fileSize ?? null,
      contentType: parsed.data.contentType ?? null,
    })
    .returning();

  res.status(201).json(ListResourcesResponseItem.parse(resource));
});

router.delete("/resources/:id", async (req, res): Promise<void> => {
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
    await objectStorageService.deleteObjectEntity(deleted.objectPath);
  } catch (error) {
    req.log.error(
      { err: error, objectPath: deleted.objectPath },
      "Deleted resource record but failed to remove stored file",
    );
  }

  res.sendStatus(204);
});

export default router;
