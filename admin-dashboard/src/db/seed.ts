import { activityLog, announcements, galleryItems, schoolEvents, staffProfiles } from "./schema";
import { getClient, getDb } from "./index";
import { announcementSeed, eventSeed, gallerySeed, staffSeed } from "./sample-data";
import { announcementSchema, eventSchema, gallerySchema, staffSchema } from "@/lib/schemas";

const SEEDED_AT = "2026-11-03T07:00:00.000Z";

async function insertSample() {
  const db = getDb();
  const gallery = gallerySeed.map((item) => gallerySchema.parse(item));
  const news = announcementSeed.map((item) => announcementSchema.parse(item));
  const events = eventSeed.map((item) => eventSchema.parse(item));
  const staff = staffSeed.map((item) => staffSchema.parse(item));
  const stamp = { createdAt: SEEDED_AT, updatedAt: SEEDED_AT };

  await db.insert(galleryItems).values(gallery.map((item) => ({ ...item, ...stamp })));
  await db.insert(announcements).values(news.map((item) => ({ ...item, ...stamp })));
  await db.insert(schoolEvents).values(events.map((item) => ({ ...item, ...stamp })));
  await db.insert(staffProfiles).values(staff.map((item) => ({ ...item, ...stamp })));
  await db.insert(activityLog).values({
    actorRole: "administrator",
    action: "seed",
    entity: "library",
    entityId: null,
    summary: "Loaded the Grace High School Gayaza sample library",
    createdAt: SEEDED_AT,
  });
}

export async function seedIfEmpty() {
  const db = getDb();
  const existing = await db.select({ id: galleryItems.id }).from(galleryItems).limit(1);
  if (existing.length > 0) return;
  await insertSample();
}

export async function resetAndSeed() {
  await getClient().execute("DELETE FROM activity_log");
  await getClient().execute("DELETE FROM gallery_items");
  await getClient().execute("DELETE FROM announcements");
  await getClient().execute("DELETE FROM school_events");
  await getClient().execute("DELETE FROM staff_profiles");
  await insertSample();
}
