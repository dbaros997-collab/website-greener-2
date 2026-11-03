import { desc } from "drizzle-orm";
import { ensureReady, getDb } from "@/db";
import { activityLog, announcements, galleryItems, schoolEvents, staffProfiles } from "@/db/schema";
import { isLandingGallery, isLiveAnnouncement, isScheduledAnnouncement, isUpcomingEvent } from "./publishing";

export async function loadMetrics() {
  await ensureReady();
  const db = getDb();
  const now = Date.now();
  const [gallery, news, events, staff, activity] = await Promise.all([
    db.select().from(galleryItems),
    db.select().from(announcements),
    db.select().from(schoolEvents),
    db.select().from(staffProfiles),
    db.select().from(activityLog).orderBy(desc(activityLog.id)).limit(10),
  ]);

  const upcoming = events
    .filter((item) => isUpcomingEvent(item, now))
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt));

  return {
    generatedAt: new Date(now).toISOString(),
    gallery: {
      total: gallery.length,
      featured: gallery.filter(isLandingGallery).length,
      onWebsite: gallery.filter((item) => item.status === "published").length,
    },
    announcements: {
      live: news.filter((item) => isLiveAnnouncement(item, now)).length,
      scheduled: news.filter((item) => isScheduledAnnouncement(item, now)).length,
      drafts: news.filter((item) => item.status === "draft").length,
    },
    events: {
      upcoming: upcoming.length,
      next: upcoming.slice(0, 4),
    },
    staff: {
      total: staff.length,
      visible: staff.filter((item) => item.visible).length,
    },
    featuredGallery: gallery
      .filter(isLandingGallery)
      .sort((a, b) => b.takenOn.localeCompare(a.takenOn))
      .slice(0, 4),
    activity,
  };
}
