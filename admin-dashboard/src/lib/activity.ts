import { activityLog } from "@/db/schema";
import { getDb } from "@/db";
import type { Role } from "./permissions";

export async function logActivity(
  role: Role,
  action: string,
  entity: string,
  entityId: number | null,
  summary: string,
) {
  await getDb().insert(activityLog).values({
    actorRole: role,
    action,
    entity,
    entityId,
    summary: summary.slice(0, 240),
    createdAt: new Date().toISOString(),
  });
}

export function describeChange(title: string, body: Record<string, unknown>, fallback: string) {
  if (body.status === "archived") return `Archived “${title}”`;
  if (body.status === "published") return `Published “${title}”`;
  if (body.status === "hidden") return `Hid “${title}” from the website`;
  if (body.status === "draft") return `Moved “${title}” back to draft`;
  if (body.status === "cancelled") return `Cancelled “${title}”`;
  if (body.status === "completed") return `Marked “${title}” completed`;
  if (body.status === "scheduled") return `Scheduled “${title}”`;
  if (body.featured === true) return `Featured “${title}” for the landing page`;
  if (body.featured === false) return `Cleared the landing-page feature on “${title}”`;
  if (body.visible === false) return `Hid ${title} from the public directory`;
  if (body.visible === true) return `Restored ${title} to the public directory`;
  return fallback;
}
