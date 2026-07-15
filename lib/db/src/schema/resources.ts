import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

/** Admin-managed folders in the Download Centre (e.g. Past Papers, Syllabus). */
export const resourceCategoriesTable = pgTable("resource_categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  /** Stable key used for filtering (e.g. past_paper, application_form). */
  slug: text("slug").notNull().unique(),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const resourcesTable = pgTable("resources", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  subject: text("subject").notNull(),
  /** Denormalized slug of the category (kept for filters / Applications tab). */
  category: text("category").notNull(),
  /** FK to resource_categories.id — the folder this file lives in. */
  categoryId: integer("category_id"),
  level: text("level").notNull().default("All"),
  term: text("term"),
  objectPath: text("object_path").notNull(),
  fileName: text("file_name").notNull(),
  fileSize: integer("file_size"),
  contentType: text("content_type"),
  /** When false, kept in the admin archive but hidden from the public Download Centre. */
  isVisible: boolean("is_visible").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const insertResourceCategorySchema = createInsertSchema(
  resourceCategoriesTable,
).omit({
  id: true,
  createdAt: true,
});
export type InsertResourceCategory = z.infer<typeof insertResourceCategorySchema>;
export type ResourceCategory = typeof resourceCategoriesTable.$inferSelect;

export const insertResourceSchema = createInsertSchema(resourcesTable).omit({
  id: true,
  createdAt: true,
});
export type InsertResource = z.infer<typeof insertResourceSchema>;
export type Resource = typeof resourcesTable.$inferSelect;
