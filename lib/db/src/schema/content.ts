import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";

// Shared ordering + visibility columns used by every editable content section.
const ordering = {
  isVisible: boolean("is_visible").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
};

// News ticker messages.
export const newsItemsTable = pgTable("news_items", {
  id: serial("id").primaryKey(),
  message: text("message").notNull(),
  ...ordering,
});

// Gallery / campus photos (image uploaded to object storage).
export const galleryImagesTable = pgTable("gallery_images", {
  id: serial("id").primaryKey(),
  caption: text("caption").notNull(),
  category: text("category").notNull().default("campus"),
  objectPath: text("object_path").notNull(),
  wide: boolean("wide").notNull().default(false),
  ...ordering,
});

// Community testimonials.
export const testimonialsTable = pgTable("testimonials", {
  id: serial("id").primaryKey(),
  quote: text("quote").notNull(),
  name: text("name").notNull(),
  role: text("role").notNull().default(""),
  initials: text("initials").notNull().default(""),
  ...ordering,
});

// School videos (YouTube).
export const videosTable = pgTable("videos", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  category: text("category").notNull().default("Featured"),
  youtubeId: text("youtube_id").notNull(),
  ...ordering,
});

// Academic programmes.
export const programmesTable = pgTable("programmes", {
  id: serial("id").primaryKey(),
  tag: text("tag").notNull().default(""),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  subjects: text("subjects").array().notNull().default([]),
  ...ordering,
});

// Hero / header stat counters.
export const statsTable = pgTable("stats", {
  id: serial("id").primaryKey(),
  value: text("value").notNull(),
  label: text("label").notNull(),
  ...ordering,
});

// "What we stand for" value cards (about / values section).
export const schoolValuesTable = pgTable("school_values", {
  id: serial("id").primaryKey(),
  icon: text("icon").notNull().default(""),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  ...ordering,
});

// Admissions process steps.
export const admissionStepsTable = pgTable("admission_steps", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  ...ordering,
});

// Editable section-level copy (singletons keyed by a stable string, e.g. the
// About heading, the Programmes intro paragraph). Not a reorderable list —
// staff only edit each block's value.
export const siteTextTable = pgTable("site_text", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  label: text("label").notNull(),
  value: text("value").notNull().default(""),
  multiline: boolean("multiline").notNull().default(false),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
