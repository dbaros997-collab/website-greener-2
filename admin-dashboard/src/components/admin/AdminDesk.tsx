"use client";

import { Badge, ErrorNote, Field, buttonClass, controlClass } from "@/components/ui/primitives";
import { api } from "@/lib/client-api";
import {
  AUDIENCE_LABELS,
  EVENT_TYPE_LABELS,
  GALLERY_CATEGORIES,
  GALLERY_CATEGORY_LABELS,
  PRIORITIES,
  PRIORITY_LABELS,
  STAFF_GROUP_LABELS,
} from "@/lib/constants";
import { formatDate, formatDateTime, initials, mediaPoster } from "@/lib/format";
import { renderRichText } from "@/lib/rich-text";
import { CalendarDays, ImagePlus, Megaphone, Upload, Users } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

const FEED_URL = "http://localhost:3100/api/public/content?raw=1";

type FeedPhoto = {
  id: number;
  title: string;
  description: string;
  category: string;
  mediaType: string;
  mediaUrl: string;
  takenOn: string;
};

type FeedNotice = {
  id: number;
  title: string;
  body: string;
  priority: string;
  publishAt: string;
};

type FeedEvent = {
  id: number;
  title: string;
  description: string;
  eventType: string;
  venue: string;
  startsAt: string;
  endsAt: string;
  audiences: string[];
};

type FeedStaff = {
  id: number;
  name: string;
  title: string;
  department: string;
  bio: string;
  photoUrl: string;
  staffGroup: string;
};

type PublicFeed = {
  school: string;
  site: string;
  generatedAt: string;
  landingGallery: FeedPhoto[];
  announcements: FeedNotice[];
  upcomingEvents: FeedEvent[];
  staff: FeedStaff[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isFeed(value: unknown): value is PublicFeed {
  if (!isRecord(value)) return false;
  return (
    typeof value.school === "string" &&
    Array.isArray(value.landingGallery) &&
    Array.isArray(value.announcements) &&
    Array.isArray(value.upcomingEvents) &&
    Array.isArray(value.staff)
  );
}

function labelOf(map: Record<string, string>, key: string) {
  return map[key] ?? key;
}

function todayInKampala() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Kampala",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

const SECTIONS = [
  { href: "#photo-upload", label: "Photo upload", icon: ImagePlus },
  { href: "#news-manager", label: "News manager", icon: Megaphone },
  { href: "#events", label: "Events", icon: CalendarDays },
  { href: "#staff", label: "Staff", icon: Users },
];

export function AdminDesk() {
  const [feed, setFeed] = useState<PublicFeed | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [photoMessage, setPhotoMessage] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [newsMessage, setNewsMessage] = useState<string | null>(null);
  const [newsError, setNewsError] = useState<string | null>(null);
  const [savingNews, setSavingNews] = useState(false);

  const load = useCallback(async () => {
    try {
      const response = await fetch(FEED_URL);
      if (!response.ok) {
        throw new Error("The content feed is unavailable.");
      }
      const payload: unknown = await response.json();
      if (!isFeed(payload)) {
        throw new Error("The content feed could not be read.");
      }
      setFeed(payload);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "The content feed could not be read.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function uploadPhoto(form: FormData): Promise<boolean> {
    setUploading(true);
    setPhotoError(null);
    setPhotoMessage(null);
    try {
      const file = form.get("file");
      const title = String(form.get("title") ?? "").trim();
      const description = String(form.get("description") ?? "").trim();
      const category = String(form.get("category") ?? "campus_life");
      if (!(file instanceof File) || file.size === 0) {
        throw new Error("Choose a photo to upload.");
      }
      if (!title) throw new Error("Add a title for this photo.");

      const body = new FormData();
      body.set("file", file);
      const uploaded = await api<{ url: string; mediaType: "image" | "video" }>("/api/upload", {
        method: "POST",
        body,
      });
      await api("/api/gallery", {
        method: "POST",
        body: JSON.stringify({
          title,
          description,
          category,
          mediaType: uploaded.mediaType,
          mediaUrl: uploaded.url,
          takenOn: todayInKampala(),
          featured: true,
          status: "published",
        }),
      });
      setPhotoMessage("Photo added to the landing gallery.");
      await load();
      return true;
    } catch (err) {
      setPhotoError(err instanceof Error ? err.message : "The photo could not be saved.");
      return false;
    } finally {
      setUploading(false);
    }
  }

  async function publishNotice(form: FormData): Promise<boolean> {
    setSavingNews(true);
    setNewsError(null);
    setNewsMessage(null);
    try {
      const title = String(form.get("title") ?? "").trim();
      const body = String(form.get("body") ?? "").trim();
      const priority = String(form.get("priority") ?? "general");
      if (!title || !body) throw new Error("Add a headline and the notice text.");
      await api("/api/news", {
        method: "POST",
        body: JSON.stringify({
          title,
          body,
          priority,
          status: "published",
          publishAt: new Date().toISOString(),
        }),
      });
      setNewsMessage("Notice published.");
      await load();
      return true;
    } catch (err) {
      setNewsError(err instanceof Error ? err.message : "The notice could not be published.");
      return false;
    } finally {
      setSavingNews(false);
    }
  }

  const photos = feed?.landingGallery ?? [];
  const notices = feed?.announcements ?? [];
  const events = feed?.upcomingEvents ?? [];
  const staff = feed?.staff ?? [];

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-forest-700 dark:text-gold-300">Admin</p>
        <h1 className="mt-1 font-serif text-3xl text-forest-900 dark:text-white sm:text-4xl">
          {feed?.school ?? "Grace High School Gayaza"}
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-ink/70 dark:text-emerald-100/70">
          Landing photos, live notices, upcoming events, and the staff directory for the public site.
          {feed ? ` Updated ${formatDateTime(feed.generatedAt)}.` : ""}
        </p>
      </header>

      <ErrorNote message={error} />

      <div className="grid items-start gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
        <aside className="rounded-2xl border border-forest-900/10 bg-white p-3 dark:border-white/10 dark:bg-[#102117] lg:sticky lg:top-24">
          <p className="px-2 pb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-forest-700 dark:text-gold-300">
            Sidebar
          </p>
          <nav className="flex flex-col gap-1" aria-label="Admin sections">
            {SECTIONS.map((item) => {
              const Icon = item.icon;
              return (
                <a
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-forest-900 hover:bg-forest-100 dark:text-white dark:hover:bg-white/10"
                >
                  <Icon size={16} />
                  {item.label}
                </a>
              );
            })}
          </nav>
        </aside>

        <div className="space-y-8">
          <section id="photo-upload" className="scroll-mt-24 space-y-4">
            <div>
              <h2 className="font-serif text-2xl text-forest-900 dark:text-white">Photo upload</h2>
              <p className="mt-1 text-sm text-ink/70 dark:text-emerald-100/70">
                {loading ? "Loading photos…" : `${photos.length} featured photos on the landing page.`}
              </p>
            </div>

            <form
              className="grid gap-4 rounded-2xl border border-dashed border-forest-900/20 bg-white p-4 dark:border-white/20 dark:bg-[#102117] sm:grid-cols-2"
              onSubmit={(event) => {
                event.preventDefault();
                const form = event.currentTarget;
                void uploadPhoto(new FormData(form)).then((saved) => {
                  if (saved) form.reset();
                });
              }}
            >
              <div className="sm:col-span-2 flex items-center gap-2 text-sm font-semibold text-forest-900 dark:text-white">
                <Upload size={16} />
                Upload a photo
              </div>
              <Field label="Title">
                <input name="title" className={controlClass} placeholder="Students on the green" />
              </Field>
              <Field label="Category">
                <select name="category" className={controlClass} defaultValue="campus_life">
                  {GALLERY_CATEGORIES.map((category) => (
                    <option key={category} value={category}>
                      {GALLERY_CATEGORY_LABELS[category]}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Description" hint="Optional">
                <input name="description" className={controlClass} placeholder="Where and when this was taken" />
              </Field>
              <Field label="Photo">
                <input name="file" type="file" accept="image/*,video/mp4,video/webm" className={controlClass} />
              </Field>
              {photoError ? (
                <div className="sm:col-span-2">
                  <ErrorNote message={photoError} />
                </div>
              ) : null}
              {photoMessage ? <p className="sm:col-span-2 text-sm text-forest-800 dark:text-gold-300">{photoMessage}</p> : null}
              <div className="sm:col-span-2">
                <button type="submit" className={buttonClass()} disabled={uploading}>
                  {uploading ? "Uploading…" : "Add to gallery"}
                </button>
              </div>
            </form>

            <div className="grid gap-4 sm:grid-cols-2">
              {photos.map((item) => {
                const poster = mediaPoster(item.mediaType, item.mediaUrl);
                return (
                  <article
                    key={item.id}
                    className="overflow-hidden rounded-2xl border border-forest-900/10 bg-white dark:border-white/10 dark:bg-[#102117]"
                  >
                    {poster ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={poster} alt="" className="h-44 w-full object-cover" />
                    ) : (
                      <div className="flex h-44 items-center justify-center bg-forest-900 text-sm text-gold-300">Video</div>
                    )}
                    <div className="space-y-1 p-4">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-forest-700 dark:text-gold-300">
                        {labelOf(GALLERY_CATEGORY_LABELS, item.category)} · {formatDate(item.takenOn)}
                      </p>
                      <h3 className="font-serif text-xl text-forest-900 dark:text-white">{item.title}</h3>
                      <p className="text-sm leading-6 text-ink/70 dark:text-emerald-100/70">{item.description}</p>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>

          <section id="news-manager" className="scroll-mt-24 space-y-4">
            <div>
              <h2 className="font-serif text-2xl text-forest-900 dark:text-white">News manager</h2>
              <p className="mt-1 text-sm text-ink/70 dark:text-emerald-100/70">
                {loading ? "Loading notices…" : `${notices.length} live notices.`}
              </p>
            </div>

            <form
              className="grid gap-4 rounded-2xl border border-forest-900/10 bg-white p-4 dark:border-white/10 dark:bg-[#102117]"
              onSubmit={(event) => {
                event.preventDefault();
                const form = event.currentTarget;
                void publishNotice(new FormData(form)).then((saved) => {
                  if (saved) form.reset();
                });
              }}
            >
              <Field label="Headline">
                <input name="title" className={controlClass} placeholder="Parents' visitation day" />
              </Field>
              <Field label="Notice">
                <textarea name="body" rows={4} className={controlClass} placeholder="Write the announcement" />
              </Field>
              <Field label="Priority">
                <select name="priority" className={controlClass} defaultValue="general">
                  {PRIORITIES.map((priority) => (
                    <option key={priority} value={priority}>
                      {PRIORITY_LABELS[priority]}
                    </option>
                  ))}
                </select>
              </Field>
              <ErrorNote message={newsError} />
              {newsMessage ? <p className="text-sm text-forest-800 dark:text-gold-300">{newsMessage}</p> : null}
              <div>
                <button type="submit" className={buttonClass()} disabled={savingNews}>
                  {savingNews ? "Publishing…" : "Publish notice"}
                </button>
              </div>
            </form>

            <div className="overflow-x-auto rounded-2xl border border-forest-900/10 bg-white dark:border-white/10 dark:bg-[#102117]">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-forest-900/10 text-[11px] uppercase tracking-wide text-forest-700 dark:border-white/10 dark:text-gold-300">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Notice</th>
                    <th className="px-4 py-3 font-semibold">Priority</th>
                    <th className="px-4 py-3 font-semibold">Published</th>
                  </tr>
                </thead>
                <tbody>
                  {notices.map((item) => (
                    <tr key={item.id} className="border-b border-forest-900/5 align-top last:border-0 dark:border-white/5">
                      <td className="px-4 py-3">
                        <p className="font-medium text-forest-900 dark:text-white">{item.title}</p>
                        <div
                          className="mt-1 max-w-xl text-ink/70 dark:text-emerald-100/70 [&_a]:underline [&_h3]:font-serif [&_ul]:list-disc [&_ul]:pl-5"
                          dangerouslySetInnerHTML={{ __html: renderRichText(item.body) }}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <Badge tone={item.priority === "urgent" ? "rose" : item.priority === "newsletter" ? "gold" : "green"}>
                          {labelOf(PRIORITY_LABELS, item.priority)}
                        </Badge>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-ink/70 dark:text-emerald-100/70">
                        {formatDateTime(item.publishAt)}
                      </td>
                    </tr>
                  ))}
                  {!loading && notices.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-4 py-6 text-ink/60 dark:text-emerald-100/60">
                        No live notices yet.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </section>

          <section id="events" className="scroll-mt-24 space-y-4">
            <h2 className="font-serif text-2xl text-forest-900 dark:text-white">Upcoming events</h2>
            <div className="overflow-x-auto rounded-2xl border border-forest-900/10 bg-white dark:border-white/10 dark:bg-[#102117]">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-forest-900/10 text-[11px] uppercase tracking-wide text-forest-700 dark:border-white/10 dark:text-gold-300">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Event</th>
                    <th className="px-4 py-3 font-semibold">When</th>
                    <th className="px-4 py-3 font-semibold">Venue</th>
                    <th className="px-4 py-3 font-semibold">Audience</th>
                  </tr>
                </thead>
                <tbody>
                  {events.map((item) => (
                    <tr key={item.id} className="border-b border-forest-900/5 align-top last:border-0 dark:border-white/5">
                      <td className="px-4 py-3">
                        <p className="font-medium text-forest-900 dark:text-white">{item.title}</p>
                        <p className="mt-1 text-ink/70 dark:text-emerald-100/70">{item.description}</p>
                        <p className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-forest-700 dark:text-gold-300">
                          {labelOf(EVENT_TYPE_LABELS, item.eventType)}
                        </p>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-ink/70 dark:text-emerald-100/70">
                        {formatDateTime(item.startsAt)}
                      </td>
                      <td className="px-4 py-3 text-ink/70 dark:text-emerald-100/70">{item.venue}</td>
                      <td className="px-4 py-3 text-ink/70 dark:text-emerald-100/70">
                        {item.audiences.map((tag) => labelOf(AUDIENCE_LABELS, tag)).join(", ")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section id="staff" className="scroll-mt-24 space-y-4">
            <h2 className="font-serif text-2xl text-forest-900 dark:text-white">Staff directory</h2>
            <div className="overflow-x-auto rounded-2xl border border-forest-900/10 bg-white dark:border-white/10 dark:bg-[#102117]">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-forest-900/10 text-[11px] uppercase tracking-wide text-forest-700 dark:border-white/10 dark:text-gold-300">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Name</th>
                    <th className="px-4 py-3 font-semibold">Role</th>
                    <th className="px-4 py-3 font-semibold">Group</th>
                  </tr>
                </thead>
                <tbody>
                  {staff.map((item) => (
                    <tr key={item.id} className="border-b border-forest-900/5 last:border-0 dark:border-white/5">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {item.photoUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={item.photoUrl} alt="" className="h-10 w-10 rounded-full object-cover" />
                          ) : (
                            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-forest-900 text-xs font-semibold text-gold-300">
                              {initials(item.name)}
                            </span>
                          )}
                          <span className="font-medium text-forest-900 dark:text-white">{item.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-ink/70 dark:text-emerald-100/70">
                        {item.title}
                        <span className="block text-xs">{item.department}</span>
                      </td>
                      <td className="px-4 py-3 text-ink/70 dark:text-emerald-100/70">
                        {labelOf(STAFF_GROUP_LABELS, item.staffGroup)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
