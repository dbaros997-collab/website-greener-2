export const GALLERY_CATEGORIES = [
  "sports",
  "academics",
  "campus_life",
  "events",
  "ceremonies",
] as const;

export const GALLERY_STATUSES = ["published", "hidden", "archived"] as const;
export const MEDIA_TYPES = ["image", "video"] as const;

export const PRIORITIES = ["urgent", "general", "newsletter"] as const;
export const ANNOUNCEMENT_STATUSES = ["draft", "published", "archived"] as const;

export const EVENT_TYPES = [
  "term_start",
  "term_end",
  "sports_day",
  "open_day",
  "exams",
  "other",
] as const;
export const EVENT_STATUSES = ["scheduled", "completed", "cancelled"] as const;
export const AUDIENCES = ["parents", "students", "public"] as const;

export const STAFF_GROUPS = ["teaching", "administration"] as const;

export const GALLERY_CATEGORY_LABELS: Record<(typeof GALLERY_CATEGORIES)[number], string> = {
  sports: "Sports",
  academics: "Academics",
  campus_life: "Campus Life",
  events: "Events",
  ceremonies: "Ceremonies",
};

export const GALLERY_STATUS_LABELS: Record<(typeof GALLERY_STATUSES)[number], string> = {
  published: "On website",
  hidden: "Hidden",
  archived: "Archived",
};

export const PRIORITY_LABELS: Record<(typeof PRIORITIES)[number], string> = {
  urgent: "Urgent notice",
  general: "General update",
  newsletter: "Term newsletter",
};

export const ANNOUNCEMENT_STATUS_LABELS: Record<(typeof ANNOUNCEMENT_STATUSES)[number], string> = {
  draft: "Draft",
  published: "Published",
  archived: "Archived",
};

export const EVENT_TYPE_LABELS: Record<(typeof EVENT_TYPES)[number], string> = {
  term_start: "Term start",
  term_end: "Term end",
  sports_day: "Sports Day",
  open_day: "Open Day",
  exams: "Exams",
  other: "Other",
};

export const EVENT_STATUS_LABELS: Record<(typeof EVENT_STATUSES)[number], string> = {
  scheduled: "Scheduled",
  completed: "Completed",
  cancelled: "Cancelled",
};

export const AUDIENCE_LABELS: Record<(typeof AUDIENCES)[number], string> = {
  parents: "Parents",
  students: "Students",
  public: "Public",
};

export const STAFF_GROUP_LABELS: Record<(typeof STAFF_GROUPS)[number], string> = {
  teaching: "Teaching",
  administration: "Administration",
};

export const DEPARTMENTS = [
  "Administration",
  "Academics",
  "Student Affairs",
  "Guidance & Careers",
  "Finance",
] as const;

export const LIVE_SITE = "https://gracehighschoolgayaza.academy";

export function isSafeMediaUrl(value: string) {
  if (value.startsWith("/uploads/") || value.startsWith("/seed/")) {
    return !value.includes("..") && !value.includes("\\");
  }
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}
