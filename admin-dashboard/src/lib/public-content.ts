import { asc, desc } from "drizzle-orm";
import { ensureReady, getDb } from "@/db";
import { announcements, galleryItems, schoolEvents, staffProfiles } from "@/db/schema";
import { LIVE_SITE } from "@/lib/constants";
import { isLandingGallery, isLiveAnnouncement, isUpcomingEvent } from "@/lib/publishing";

export async function loadPublicFeed() {
  await ensureReady();
  const db = getDb();
  const now = Date.now();
  const [gallery, news, events, staff] = await Promise.all([
    db.select().from(galleryItems).orderBy(desc(galleryItems.takenOn)),
    db.select().from(announcements).orderBy(desc(announcements.publishAt)),
    db.select().from(schoolEvents).orderBy(asc(schoolEvents.startsAt)),
    db.select().from(staffProfiles).orderBy(asc(staffProfiles.name)),
  ]);

  return {
    school: "Grace High School Gayaza",
    site: LIVE_SITE,
    generatedAt: new Date(now).toISOString(),
    landingGallery: gallery.filter(isLandingGallery).map((item) => ({
      id: item.id,
      title: item.title,
      description: item.description,
      category: item.category,
      mediaType: item.mediaType,
      mediaUrl: item.mediaUrl,
      takenOn: item.takenOn,
    })),
    announcements: news.filter((item) => isLiveAnnouncement(item, now)).map((item) => ({
      id: item.id,
      title: item.title,
      body: item.body,
      priority: item.priority,
      publishAt: item.publishAt,
    })),
    upcomingEvents: events.filter((item) => isUpcomingEvent(item, now)).map((item) => ({
      id: item.id,
      title: item.title,
      description: item.description,
      eventType: item.eventType,
      venue: item.venue,
      startsAt: item.startsAt,
      endsAt: item.endsAt,
      audiences: item.audiences,
    })),
    staff: staff.filter((item) => item.visible).map((item) => ({
      id: item.id,
      name: item.name,
      title: item.title,
      department: item.department,
      bio: item.bio,
      photoUrl: item.photoUrl,
      email: item.email,
      phone: item.phone,
      staffGroup: item.staffGroup,
    })),
  };
}

export type PublicFeed = Awaited<ReturnType<typeof loadPublicFeed>>;
