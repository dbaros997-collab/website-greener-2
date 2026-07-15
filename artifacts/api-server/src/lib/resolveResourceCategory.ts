import { eq } from "drizzle-orm";
import { db, resourceCategoriesTable } from "@workspace/db";

/** Resolve categoryId + slug for create/update from either field. */
export async function resolveResourceCategory(input: {
  categoryId?: number | null;
  category?: string | null;
}): Promise<{ categoryId: number; category: string } | { error: string }> {
  if (input.categoryId != null) {
    const [row] = await db
      .select()
      .from(resourceCategoriesTable)
      .where(eq(resourceCategoriesTable.id, input.categoryId))
      .limit(1);
    if (!row) return { error: "Category not found." };
    return { categoryId: row.id, category: row.slug };
  }

  if (input.category) {
    const slug = input.category.trim().toLowerCase();
    const [row] = await db
      .select()
      .from(resourceCategoriesTable)
      .where(eq(resourceCategoriesTable.slug, slug))
      .limit(1);
    if (!row) {
      return {
        error: `Unknown category "${slug}". Create the folder first, or pick an existing one.`,
      };
    }
    return { categoryId: row.id, category: row.slug };
  }

  return { error: "categoryId or category is required." };
}
