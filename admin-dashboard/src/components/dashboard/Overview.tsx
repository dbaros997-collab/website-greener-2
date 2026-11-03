"use client";

import { useDeskSession } from "@/components/shell/AppShell";
import { Badge, PageIntro, buttonClass } from "@/components/ui/primitives";
import { api } from "@/lib/client-api";
import { LIVE_SITE } from "@/lib/constants";
import { formatDateTime, formatRelative, mediaPoster } from "@/lib/format";
import type { ActivityEntry, GalleryItem, SchoolEvent } from "@/lib/types";
import {
  CalendarDays,
  Download,
  ExternalLink,
  FileJson,
  Images,
  Megaphone,
  RefreshCw,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type Metrics = {
  generatedAt: string;
  gallery: { total: number; featured: number; onWebsite: number };
  announcements: { live: number; scheduled: number; drafts: number };
  events: { upcoming: number; next: SchoolEvent[] };
  staff: { total: number; visible: number };
  featuredGallery: GalleryItem[];
  activity: ActivityEntry[];
};

type SiteStatus = {
  online: boolean;
  httpStatus: number;
  latencyMs: number;
  checkedAt: string;
  url: string;
};

export function Overview() {
  const { session } = useDeskSession();
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [site, setSite] = useState<SiteStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);
  const [collection, setCollection] = useState("gallery");
  const [tick, setTick] = useState(0);

  const load = useCallback(async () => {
    try {
      const [nextMetrics, nextSite] = await Promise.all([
        api<Metrics>("/api/stats"),
        api<SiteStatus>("/api/site-status"),
      ]);
      setMetrics(nextMetrics);
      setSite(nextSite);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "The overview could not refresh.");
    }
  }, []);

  useEffect(() => {
    void load();
    const id = window.setInterval(() => void load(), 15000);
    return () => window.clearInterval(id);
  }, [load]);

  useEffect(() => {
    const id = window.setInterval(() => setTick((value) => value + 1), 15000);
    return () => window.clearInterval(id);
  }, []);

  async function download(format: "json" | "csv") {
    setExportError(null);
    const params = new URLSearchParams({ format });
    if (format === "csv") params.set("collection", collection);
    const response = await fetch(`/api/export?${params}`);
    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as { error?: string } | null;
      setExportError(body?.error || "Export failed.");
      return;
    }
    const blob = await response.blob();
    const match = response.headers.get("Content-Disposition")?.match(/filename="([^"]+)"/);
    const href = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = href;
    link.download = match?.[1] ?? `grace-backup.${format}`;
    link.click();
    URL.revokeObjectURL(href);
  }

  const cards = [
    {
      href: "/gallery",
      label: "Gallery items",
      value: metrics?.gallery.total,
      note: metrics ? `${metrics.gallery.featured} featured on the landing feed` : "Loading",
      icon: Images,
    },
    {
      href: "/news",
      label: "Live announcements",
      value: metrics?.announcements.live,
      note: metrics
        ? `${metrics.announcements.scheduled} scheduled · ${metrics.announcements.drafts} ${metrics.announcements.drafts === 1 ? "draft" : "drafts"}`
        : "Loading",
      icon: Megaphone,
    },
    {
      href: "/events",
      label: "Upcoming events",
      value: metrics?.events.upcoming,
      note: "Term dates, exams, open days",
      icon: CalendarDays,
    },
    {
      href: "/staff",
      label: "Directory profiles",
      value: metrics?.staff.visible,
      note: metrics ? `${metrics.staff.total} records in the desk` : "Loading",
      icon: Users,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <PageIntro
          kicker="Grace High School Gayaza"
          title="Campus content overview"
          body="Gallery, notices, the academic calendar, and the staff directory for gracehighschoolgayaza.academy. Figures refresh every 15 seconds."
        />
        <button type="button" className={buttonClass("secondary")} onClick={() => void load()}>
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {error ? <p className="text-sm text-rose-700">{error}</p> : null}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.href}
              href={card.href}
              className="rounded-2xl border border-forest-900/10 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#102117]"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-forest-100 text-forest-800 dark:bg-white/10 dark:text-gold-300">
                <Icon size={18} />
              </span>
              <p className="mt-4 font-serif text-4xl text-forest-900 dark:text-white">{card.value ?? "—"}</p>
              <p className="mt-1 text-sm font-semibold">{card.label}</p>
              <p className="mt-1 text-xs text-ink/60 dark:text-emerald-100/60">{card.note}</p>
            </Link>
          );
        })}
      </section>

      <section className="grid gap-4 lg:grid-cols-5">
        <div className="space-y-4 lg:col-span-3">
          <article className="rounded-2xl border border-forest-900/10 bg-white p-5 dark:border-white/10 dark:bg-[#102117]">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-serif text-2xl text-forest-900 dark:text-white">Recent activity</h2>
              <span className="inline-flex items-center gap-2 text-xs text-ink/60 dark:text-emerald-100/60">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                Live
              </span>
            </div>
            <ul className="mt-4 divide-y divide-forest-900/10 dark:divide-white/10">
              {(metrics?.activity ?? []).map((entry) => (
                <li key={entry.id} className="flex items-start justify-between gap-4 py-3">
                  <div>
                    <p className="text-sm font-medium">{entry.summary}</p>
                    <p className="text-xs capitalize text-ink/60 dark:text-emerald-100/60">{entry.actorRole}</p>
                  </div>
                  <time className="shrink-0 text-xs text-ink/50" dateTime={entry.createdAt}>
                    {formatRelative(entry.createdAt)}
                  </time>
                </li>
              ))}
              {metrics && metrics.activity.length === 0 ? <li className="py-6 text-sm">No changes yet.</li> : null}
            </ul>
            <span className="sr-only">{tick}</span>
          </article>

          <article className="rounded-2xl border border-forest-900/10 bg-white p-5 dark:border-white/10 dark:bg-[#102117]">
            <h2 className="font-serif text-2xl text-forest-900 dark:text-white">Landing page selection</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {(metrics?.featuredGallery ?? []).map((item) => {
                const poster = mediaPoster(item.mediaType, item.mediaUrl);
                return (
                  <figure key={item.id} className="overflow-hidden rounded-xl border border-forest-900/10 dark:border-white/10">
                    {poster ? (
                      // Seed and upload files are local; video posters come from YouTube.
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={poster} alt="" className="h-32 w-full object-cover" />
                    ) : (
                      <div className="flex h-32 items-center justify-center bg-forest-900 text-sm text-gold-300">Video</div>
                    )}
                    <figcaption className="px-3 py-2 text-sm font-medium">{item.title}</figcaption>
                  </figure>
                );
              })}
            </div>
          </article>
        </div>

        <div className="space-y-4 lg:col-span-2">
          <article className="rounded-2xl border border-forest-900/10 bg-forest-900 p-5 text-white">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-serif text-2xl">Site status</h2>
              <Badge tone={site?.online ? "green" : "rose"}>{site ? (site.online ? "Online" : "Unreachable") : "Checking"}</Badge>
            </div>
            <p className="mt-3 text-sm text-white/75">gracehighschoolgayaza.academy</p>
            <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-white/50">HTTP</dt>
                <dd className="font-semibold">{site?.httpStatus || "—"}</dd>
              </div>
              <div>
                <dt className="text-white/50">Response</dt>
                <dd className="font-semibold">{site ? `${site.latencyMs} ms` : "—"}</dd>
              </div>
            </dl>
            <p className="mt-3 text-xs text-white/50">
              {site ? `Checked ${formatDateTime(site.checkedAt)}` : "Waiting for the first check"}
            </p>
            <a href={LIVE_SITE} target="_blank" rel="noreferrer" className={`${buttonClass("primary")} mt-4 bg-gold-500 text-forest-950 hover:bg-gold-300`}>
              <ExternalLink size={16} />
              Open the live site
            </a>
          </article>

          <article className="rounded-2xl border border-forest-900/10 bg-white p-5 dark:border-white/10 dark:bg-[#102117]">
            <h2 className="font-serif text-2xl text-forest-900 dark:text-white">Quick actions</h2>
            <div className="mt-4 grid gap-2">
              <Link href="/gallery" className={buttonClass("secondary")}>Add or feature a gallery item</Link>
              <Link href="/news" className={buttonClass("secondary")}>Write an announcement</Link>
              <Link href="/events" className={buttonClass("secondary")}>Schedule a calendar event</Link>
              <Link href="/staff" className={buttonClass("secondary")}>Update the staff directory</Link>
              <Link href="/preview" className={buttonClass("ghost")}>Preview the public landing feed</Link>
            </div>
          </article>

          <article className="rounded-2xl border border-forest-900/10 bg-white p-5 dark:border-white/10 dark:bg-[#102117]">
            <h2 className="font-serif text-2xl text-forest-900 dark:text-white">Content backup</h2>
            {session?.canExport ? (
              <div className="mt-4 space-y-3">
                <button type="button" className={buttonClass("primary")} onClick={() => void download("json")}>
                  <FileJson size={16} />
                  Download JSON
                </button>
                <div className="flex flex-wrap gap-2">
                  <select
                    aria-label="CSV collection"
                    className="rounded-lg border border-forest-900/15 bg-white px-3 py-2 text-sm dark:border-white/15 dark:bg-[#0c1a12]"
                    value={collection}
                    onChange={(event) => setCollection(event.target.value)}
                  >
                    <option value="gallery">Gallery</option>
                    <option value="announcements">Announcements</option>
                    <option value="events">Events</option>
                    <option value="staff">Staff</option>
                  </select>
                  <button type="button" className={buttonClass("secondary")} onClick={() => void download("csv")}>
                    <Download size={16} />
                    Download CSV
                  </button>
                </div>
                {exportError ? <p className="text-sm text-rose-700">{exportError}</p> : null}
              </div>
            ) : (
              <p className="mt-3 text-sm text-ink/70 dark:text-emerald-100/70">
                Backup export is reserved for the administrator desk.
              </p>
            )}
          </article>

          <article className="rounded-2xl border border-forest-900/10 bg-white p-5 dark:border-white/10 dark:bg-[#102117]">
            <h2 className="font-serif text-2xl text-forest-900 dark:text-white">Coming up</h2>
            <ul className="mt-3 space-y-3">
              {(metrics?.events.next ?? []).map((event) => (
                <li key={event.id}>
                  <p className="text-sm font-semibold">{event.title}</p>
                  <p className="text-xs text-ink/60 dark:text-emerald-100/60">{formatDateTime(event.startsAt)} · {event.venue}</p>
                </li>
              ))}
            </ul>
          </article>
        </div>
      </section>
    </div>
  );
}
