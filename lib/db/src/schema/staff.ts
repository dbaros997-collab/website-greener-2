import { pgTable, text, serial, timestamp } from "drizzle-orm/pg-core";

// Staff accounts for the admin dashboard. Passwords are stored as scrypt hashes
// in the form `scrypt:<saltHex>:<hashHex>` — never plaintext.
export const staffUsersTable = pgTable("staff_users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type StaffUser = typeof staffUsersTable.$inferSelect;
