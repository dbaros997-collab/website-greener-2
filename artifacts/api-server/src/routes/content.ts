import { Router, type IRouter, type Request } from "express";
import { asc, eq } from "drizzle-orm";
import type { PgColumn, PgTable } from "drizzle-orm/pg-core";

// Minimal structural type for the generated zod schemas, avoiding a direct
// zod dependency in the server package.
interface ZodLike {
  parse: (value: unknown) => unknown;
  safeParse: (
    value: unknown,
  ) =>
    | { success: true; data: any }
    | { success: false; error: { message: string } };
}
import {
  db,
  newsItemsTable,
  galleryImagesTable,
  testimonialsTable,
  videosTable,
  programmesTable,
  statsTable,
  schoolValuesTable,
  admissionStepsTable,
} from "@workspace/db";
import {
  ListNewsItemsResponse,
  CreateNewsItemBody,
  UpdateNewsItemBody,
  ReorderNewsItemsBody,
  ListGalleryImagesResponse,
  CreateGalleryImageBody,
  UpdateGalleryImageBody,
  ReorderGalleryImagesBody,
  ListTestimonialsResponse,
  CreateTestimonialBody,
  UpdateTestimonialBody,
  ReorderTestimonialsBody,
  ListVideosResponse,
  CreateVideoBody,
  UpdateVideoBody,
  ReorderVideosBody,
  ListProgrammesResponse,
  CreateProgrammeBody,
  UpdateProgrammeBody,
  ReorderProgrammesBody,
  ListStatsResponse,
  CreateStatBody,
  UpdateStatBody,
  ReorderStatsBody,
  ListSchoolValuesResponse,
  CreateSchoolValueBody,
  UpdateSchoolValueBody,
  ReorderSchoolValuesBody,
  ListAdmissionStepsResponse,
  CreateAdmissionStepBody,
  UpdateAdmissionStepBody,
  ReorderAdmissionStepsBody,
} from "@workspace/api-zod";
import { requireAuth } from "../lib/auth";
import { ObjectStorageService } from "../lib/objectStorage";

// drizzle's generic table types make a fully-typed factory awkward; zod
// validation is the real safety net, so we use loose casts on the query builder.
type AnyTable = PgTable & {
  id: PgColumn;
  isVisible: PgColumn;
  sortOrder: PgColumn;
};

interface CrudConfig {
  resource: string;
  table: AnyTable;
  listResponse: ZodLike;
  createBody: ZodLike;
  updateBody: ZodLike;
  reorderBody: ZodLike;
  afterDelete?: (row: Record<string, unknown>, req: Request) => Promise<void>;
}

function parseId(raw: string): number | null {
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
}

function makeCrudRouter(cfg: CrudConfig): IRouter {
  const router: IRouter = Router();
  const { resource, table } = cfg;

  // Public list. Hidden items are only included for authenticated admins that
  // explicitly request them via ?includeHidden=true.
  router.get(`/${resource}`, async (req, res): Promise<void> => {
    const includeHidden =
      req.query.includeHidden === "true" || req.query.includeHidden === "1";
    const showAll = includeHidden && Boolean(req.session.userId);

    const rows = (await db
      .select()
      .from(table as PgTable)
      .orderBy(asc(table.sortOrder), asc(table.id))) as Array<
      Record<string, unknown>
    >;

    const visible = showAll ? rows : rows.filter((r) => r["isVisible"]);
    res.json(cfg.listResponse.parse(visible));
  });

  router.post(`/${resource}`, requireAuth, async (req, res): Promise<void> => {
    const parsed = cfg.createBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }

    // Place new items at the end.
    const existing = (await db
      .select()
      .from(table as PgTable)) as Array<Record<string, unknown>>;
    const maxSort = existing.reduce(
      (m, r) => Math.max(m, Number(r["sortOrder"]) || 0),
      0,
    );

    const [created] = (await db
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .insert(table as any)
      .values({ ...parsed.data, sortOrder: maxSort + 1 })
      .returning()) as Array<Record<string, unknown>>;

    res.status(201).json(created);
  });

  router.post(
    `/${resource}/reorder`,
    requireAuth,
    async (req, res): Promise<void> => {
      const parsed = cfg.reorderBody.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: parsed.error.message });
        return;
      }

      const ids: number[] = parsed.data.ids;
      await db.transaction(async (tx) => {
        for (let i = 0; i < ids.length; i++) {
          await tx
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .update(table as any)
            .set({ sortOrder: i })
            .where(eq(table.id, ids[i]!));
        }
      });

      res.json({ ok: true });
    },
  );

  router.patch(
    `/${resource}/:id`,
    requireAuth,
    async (req, res): Promise<void> => {
      const id = parseId(String(req.params.id));
      if (id === null) {
        res.status(404).json({ error: "Not found" });
        return;
      }

      const parsed = cfg.updateBody.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: parsed.error.message });
        return;
      }

      if (Object.keys(parsed.data).length === 0) {
        res.status(400).json({ error: "No fields to update" });
        return;
      }

      const [updated] = (await db
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .update(table as any)
        .set(parsed.data)
        .where(eq(table.id, id))
        .returning()) as Array<Record<string, unknown>>;

      if (!updated) {
        res.status(404).json({ error: "Not found" });
        return;
      }

      res.json(updated);
    },
  );

  router.delete(
    `/${resource}/:id`,
    requireAuth,
    async (req, res): Promise<void> => {
      const id = parseId(String(req.params.id));
      if (id === null) {
        res.status(404).json({ error: "Not found" });
        return;
      }

      const [deleted] = (await db
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .delete(table as any)
        .where(eq(table.id, id))
        .returning()) as Array<Record<string, unknown>>;

      if (!deleted) {
        res.status(404).json({ error: "Not found" });
        return;
      }

      if (cfg.afterDelete) {
        try {
          await cfg.afterDelete(deleted, req);
        } catch (err) {
          req.log.error(
            { err, resource, id },
            "Deleted record but afterDelete hook failed",
          );
        }
      }

      res.sendStatus(204);
    },
  );

  return router;
}

const objectStorageService = new ObjectStorageService();

const configs: CrudConfig[] = [
  {
    resource: "news",
    table: newsItemsTable as unknown as AnyTable,
    listResponse: ListNewsItemsResponse,
    createBody: CreateNewsItemBody,
    updateBody: UpdateNewsItemBody,
    reorderBody: ReorderNewsItemsBody,
  },
  {
    resource: "gallery-images",
    table: galleryImagesTable as unknown as AnyTable,
    listResponse: ListGalleryImagesResponse,
    createBody: CreateGalleryImageBody,
    updateBody: UpdateGalleryImageBody,
    reorderBody: ReorderGalleryImagesBody,
    afterDelete: async (row, req) => {
      const objectPath = row["objectPath"];
      if (typeof objectPath === "string" && objectPath) {
        await objectStorageService.deleteObjectEntity(objectPath);
        req.log.info({ objectPath }, "Removed gallery image file");
      }
    },
  },
  {
    resource: "testimonials",
    table: testimonialsTable as unknown as AnyTable,
    listResponse: ListTestimonialsResponse,
    createBody: CreateTestimonialBody,
    updateBody: UpdateTestimonialBody,
    reorderBody: ReorderTestimonialsBody,
  },
  {
    resource: "videos",
    table: videosTable as unknown as AnyTable,
    listResponse: ListVideosResponse,
    createBody: CreateVideoBody,
    updateBody: UpdateVideoBody,
    reorderBody: ReorderVideosBody,
  },
  {
    resource: "programmes",
    table: programmesTable as unknown as AnyTable,
    listResponse: ListProgrammesResponse,
    createBody: CreateProgrammeBody,
    updateBody: UpdateProgrammeBody,
    reorderBody: ReorderProgrammesBody,
  },
  {
    resource: "stats",
    table: statsTable as unknown as AnyTable,
    listResponse: ListStatsResponse,
    createBody: CreateStatBody,
    updateBody: UpdateStatBody,
    reorderBody: ReorderStatsBody,
  },
  {
    resource: "values",
    table: schoolValuesTable as unknown as AnyTable,
    listResponse: ListSchoolValuesResponse,
    createBody: CreateSchoolValueBody,
    updateBody: UpdateSchoolValueBody,
    reorderBody: ReorderSchoolValuesBody,
  },
  {
    resource: "admission-steps",
    table: admissionStepsTable as unknown as AnyTable,
    listResponse: ListAdmissionStepsResponse,
    createBody: CreateAdmissionStepBody,
    updateBody: UpdateAdmissionStepBody,
    reorderBody: ReorderAdmissionStepsBody,
  },
];

const router: IRouter = Router();
for (const cfg of configs) {
  router.use(makeCrudRouter(cfg));
}

export default router;
