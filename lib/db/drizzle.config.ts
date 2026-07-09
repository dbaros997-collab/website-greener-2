import { defineConfig } from "drizzle-kit";
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL, ensure the database is provisioned");
}

export default defineConfig({
  schema: [
    "./src/schema/resources.ts",
    "./src/schema/content.ts",
    "./src/schema/staff.ts",
    "./src/schema/submissions.ts",
  ],
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
});
