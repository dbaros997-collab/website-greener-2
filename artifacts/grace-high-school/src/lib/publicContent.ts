import { useEffect, useState } from "react";

/**
 * Admin dashboard feed. Vite inlines VITE_ADMIN_CONTENT_URL at build time
 * (Coolify: mark the variable Available at Buildtime).
 */
const env = import.meta.env as ImportMetaEnv & { VITE_ADMIN_CONTENT_URL?: string };

const DEV_PUBLIC_CONTENT_URL = "http://localhost:3100/api/public/content?raw=1";
const LIVE_PUBLIC_CONTENT_URL =
  "https://gracehighschoolgayaza.academy/api/public/content?raw=1";

export const PUBLIC_CONTENT_URL =
  env.VITE_ADMIN_CONTENT_URL?.trim() ||
  (import.meta.env.PROD ? LIVE_PUBLIC_CONTENT_URL : DEV_PUBLIC_CONTENT_URL);

export type FeedPhoto = {
  id: number;
  title: string;
  description: string;
  category: string;
  mediaType: string;
  mediaUrl: string;
  takenOn: string;
};

export type FeedNotice = {
  id: number;
  title: string;
  body: string;
  priority: string;
  publishAt: string;
};

export type FeedEvent = {
  id: number;
  title: string;
  description: string;
  eventType: string;
  venue: string;
  startsAt: string;
  endsAt: string;
  audiences: string[];
};

export type PublicFeed = {
  school: string;
  site: string;
  generatedAt: string;
  landingGallery: FeedPhoto[];
  announcements: FeedNotice[];
  upcomingEvents: FeedEvent[];
};

const CATEGORY_LABELS: Record<string, string> = {
  sports: "Sports",
  academics: "Academics",
  campus_life: "Campus Life",
  events: "Events",
  ceremonies: "Ceremonies",
};

const PRIORITY_LABELS: Record<string, string> = {
  urgent: "Urgent",
  general: "Notice",
  newsletter: "Newsletter",
};

const EVENT_LABELS: Record<string, string> = {
  term_start: "Term start",
  term_end: "Term end",
  sports_day: "Sports Day",
  open_day: "Open Day",
  exams: "Exams",
  other: "Event",
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isFeed(value: unknown): value is PublicFeed {
  if (!isRecord(value)) return false;
  return (
    Array.isArray(value.landingGallery) &&
    Array.isArray(value.announcements) &&
    Array.isArray(value.upcomingEvents)
  );
}

export function adminOrigin() {
  return new URL(PUBLIC_CONTENT_URL).origin;
}

export function adminAssetUrl(path: string) {
  if (!path) return "";
  if (/^https?:\/\//i.test(path)) return path;
  return `${adminOrigin()}${path.startsWith("/") ? path : `/${path}`}`;
}

function youtubeId(url: string) {
  try {
    const parsed = new URL(url);
    if (parsed.hostname === "youtu.be") return parsed.pathname.split("/").filter(Boolean)[0] ?? null;
    if (parsed.hostname.endsWith("youtube.com")) {
      if (parsed.pathname.startsWith("/embed/")) return parsed.pathname.split("/")[2] ?? null;
      return parsed.searchParams.get("v");
    }
  } catch {
    return null;
  }
  return null;
}

/** Image shown in the gallery grid, including a poster for video links. */
export function galleryImageSrc(mediaType: string, mediaUrl: string) {
  if (mediaType === "video") {
    const id = youtubeId(mediaUrl);
    if (id) return `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
  }
  return adminAssetUrl(mediaUrl);
}

export function categoryLabel(category: string) {
  return CATEGORY_LABELS[category] ?? category;
}

export function priorityLabel(priority: string) {
  return PRIORITY_LABELS[priority] ?? priority;
}

export function eventTypeLabel(eventType: string) {
  return EVENT_LABELS[eventType] ?? eventType;
}

export function noticeDateLabel(iso: string) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Africa/Kampala",
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).formatToParts(new Date(iso));
  const day = parts.find((part) => part.type === "day")?.value ?? "";
  const month = parts.find((part) => part.type === "month")?.value ?? "";
  const year = parts.find((part) => part.type === "year")?.value ?? "";
  return `${day} ${month} ${year}`;
}

export function eventWhen(iso: string) {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Africa/Kampala",
    weekday: "short",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(new Date(iso));
}

export function plainNotice(source: string) {
  return source
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/_(.*?)_/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^\s*[-*]\s+/gm, "")
    .replace(/\[(.*?)\]\((.*?)\)/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

export async function fetchPublicContent(): Promise<PublicFeed | null> {
  try {
    const response = await fetch(PUBLIC_CONTENT_URL, { cache: "no-store" });
    if (!response.ok) return null;
    const payload: unknown = await response.json();
    return isFeed(payload) ? payload : null;
  } catch {
    return null;
  }
}

/** Poll the admin feed so a save on the dashboard shows up without a reload. */
export function usePublicContent(intervalMs = 4000) {
  const [feed, setFeed] = useState<PublicFeed | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const next = await fetchPublicContent();
      if (!cancelled && next) setFeed(next);
    };

    void load();
    const id = window.setInterval(() => {
      if (document.visibilityState === "visible") void load();
    }, intervalMs);
    const onFocus = () => void load();
    window.addEventListener("focus", onFocus);

    return () => {
      cancelled = true;
      window.clearInterval(id);
      window.removeEventListener("focus", onFocus);
    };
  }, [intervalMs]);

  return feed;
}
