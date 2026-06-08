import { pgTable, text, serial, timestamp, check } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const submissionsTable = pgTable(
  "form_submissions",
  {
    id: serial("id").primaryKey(),
    type: text("type").notNull().default("enquiry"),
    firstName: text("first_name").notNull(),
    lastName: text("last_name"),
    email: text("email"),
    phone: text("phone"),
    level: text("level"),
    message: text("message"),
    fileUrl: text("file_url"),
    fileName: text("file_name"),
    status: text("status").notNull().default("new"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    check("form_submissions_type_check", sql`${t.type} IN ('enquiry', 'application')`),
    check("form_submissions_status_check", sql`${t.status} IN ('new', 'read')`),
  ],
);

export const insertSubmissionSchema = createInsertSchema(submissionsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertSubmission = z.infer<typeof insertSubmissionSchema>;
export type Submission = typeof submissionsTable.$inferSelect;
