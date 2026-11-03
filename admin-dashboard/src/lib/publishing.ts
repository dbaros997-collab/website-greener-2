import type { AnnouncementItem, GalleryItem, SchoolEvent } from "./types";

export function isLiveAnnouncement(item: AnnouncementItem, now = Date.now()) {
  return item.status === "published" && new Date(item.publishAt).getTime() <= now;
}

export function isScheduledAnnouncement(item: AnnouncementItem, now = Date.now()) {
  return item.status === "published" && new Date(item.publishAt).getTime() > now;
}

export function announcementPhase(item: AnnouncementItem, now = Date.now()) {
  if (item.status === "archived") return "archived" as const;
  if (item.status === "draft") return "draft" as const;
  return isScheduledAnnouncement(item, now) ? ("scheduled" as const) : ("live" as const);
}

export function isUpcomingEvent(item: SchoolEvent, now = Date.now()) {
  return item.status === "scheduled" && new Date(item.endsAt).getTime() >= now;
}

export function isLandingGallery(item: GalleryItem) {
  return item.status === "published" && item.featured;
}
