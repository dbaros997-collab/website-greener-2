import { z } from "zod";
import {
  ANNOUNCEMENT_STATUSES,
  AUDIENCES,
  EVENT_STATUSES,
  EVENT_TYPES,
  GALLERY_CATEGORIES,
  GALLERY_STATUSES,
  isSafeMediaUrl,
  MEDIA_TYPES,
  PRIORITIES,
  STAFF_GROUPS,
} from "./constants";

export const gallerySchema = z.object({
  title: z.string().trim().min(1, "Add a title.").max(140, "Keep the title under 140 characters."),
  description: z.string().trim().max(2000, "Keep the description under 2,000 characters."),
  category: z.enum(GALLERY_CATEGORIES, { message: "Choose a gallery category." }),
  mediaType: z.enum(MEDIA_TYPES, { message: "Choose image or video." }),
  mediaUrl: z
    .string()
    .trim()
    .min(1, "Upload a file or paste a link.")
    .max(500)
    .refine(isSafeMediaUrl, "Use an uploaded file or an http(s) link."),
  takenOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Choose the date this was taken."),
  featured: z.boolean(),
  status: z.enum(GALLERY_STATUSES, { message: "Choose whether this is on the website, hidden, or archived." }),
});

export const announcementSchema = z.object({
  title: z.string().trim().min(1, "Add a headline.").max(160, "Keep the headline under 160 characters."),
  body: z.string().trim().min(1, "Write the announcement.").max(20000, "This notice is too long."),
  priority: z.enum(PRIORITIES, { message: "Choose a priority." }),
  status: z.enum(ANNOUNCEMENT_STATUSES, { message: "Choose draft, published, or archived." }),
  publishAt: z.string().datetime({ message: "Choose a valid publish date." }),
});

export const eventSchema = z
  .object({
    title: z.string().trim().min(1, "Add an event name.").max(160),
    description: z.string().trim().max(2000),
    eventType: z.enum(EVENT_TYPES, { message: "Choose an event type." }),
    venue: z.string().trim().min(1, "Add a venue.").max(160),
    startsAt: z.string().datetime({ message: "Choose a start date and time." }),
    endsAt: z.string().datetime({ message: "Choose an end date and time." }),
    audiences: z.array(z.enum(AUDIENCES)).min(1, "Choose who the event is for."),
    status: z.enum(EVENT_STATUSES, { message: "Choose a status." }),
  })
  .refine((value) => new Date(value.endsAt).getTime() >= new Date(value.startsAt).getTime(), {
    message: "The end time needs to be the same as or after the start.",
    path: ["endsAt"],
  });

export const staffSchema = z.object({
  name: z.string().trim().min(1, "Add a name.").max(120),
  title: z.string().trim().min(1, "Add a title.").max(120),
  department: z.string().trim().min(1, "Add a department.").max(80),
  bio: z.string().trim().max(2000),
  photoUrl: z
    .string()
    .trim()
    .max(500)
    .refine((value) => value === "" || isSafeMediaUrl(value), "Use an uploaded photo or an http(s) link."),
  email: z
    .string()
    .trim()
    .max(160)
    .refine((value) => value === "" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value), "Enter a valid email or leave it blank."),
  phone: z.string().trim().max(40),
  staffGroup: z.enum(STAFF_GROUPS, { message: "Choose teaching or administration." }),
  visible: z.boolean(),
});

export type GalleryInput = z.infer<typeof gallerySchema>;
export type AnnouncementInput = z.infer<typeof announcementSchema>;
export type EventInput = z.infer<typeof eventSchema>;
export type StaffInput = z.infer<typeof staffSchema>;
