"use client";

import { useDeskSession } from "@/components/shell/AppShell";
import { RichTextEditor } from "@/components/news/RichTextEditor";
import {
  Badge,
  Drawer,
  EmptyState,
  ErrorNote,
  Field,
  PageIntro,
  buttonClass,
  controlClass,
} from "@/components/ui/primitives";
import { useDebounced } from "@/components/ui/use-debounced";
import { api } from "@/lib/client-api";
import {
  ANNOUNCEMENT_STATUSES,
  ANNOUNCEMENT_STATUS_LABELS,
  PRIORITIES,
  PRIORITY_LABELS,
} from "@/lib/constants";
import { formatDateTime, fromDateTimeInput, toDateTimeInput } from "@/lib/format";
import { announcementPhase } from "@/lib/publishing";
import { renderRichText } from "@/lib/rich-text";
import type { AnnouncementInput } from "@/lib/schemas";
import type { AnnouncementItem } from "@/lib/types";
import { Archive, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

type NewsForm = Omit<AnnouncementInput, "publishAt"> & { publishAt: string };

function blank(): NewsForm {
  return {
    title: "",
    body: "",
    priority: "general",
    status: "draft",
    publishAt: toDateTimeInput(new Date().toISOString()),
  };
}

const phaseTone = {
  live: "green",
  scheduled: "gold",
  draft: "neutral",
  archived: "ink",
} as const;

const priorityTone = {
  urgent: "rose",
  general: "green",
  newsletter: "gold",
} as const;

export function NewsManager() {
  const { session } = useDeskSession();
  const canWrite = session?.canWrite ?? false;
  const [query, setQuery] = useState("");
  const [priority, setPriority] = useState("all");
  const [status, setStatus] = useState("all");
  const debounced = useDebounced(query);
  const [items, setItems] = useState<AnnouncementItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<AnnouncementItem | null>(null);
  const [form, setForm] = useState<NewsForm>(blank());
  const [saving, setSaving] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<AnnouncementItem | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (debounced) params.set("q", debounced);
      if (priority !== "all") params.set("priority", priority);
      if (status !== "all") params.set("status", status);
      const data = await api<{ items: AnnouncementItem[] }>(`/api/news?${params}`);
      setItems(data.items);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load announcements.");
    } finally {
      setLoading(false);
    }
  }, [debounced, priority, status]);

  useEffect(() => {
    void load();
  }, [load]);

  function payload(source: NewsForm): AnnouncementInput {
    return { ...source, publishAt: fromDateTimeInput(source.publishAt) };
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setFormError(null);
    try {
      const body = JSON.stringify(payload(form));
      if (editing) await api(`/api/news/${editing.id}`, { method: "PATCH", body });
      else await api("/api/news", { method: "POST", body });
      setOpen(false);
      await load();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Could not save.");
    } finally {
      setSaving(false);
    }
  }

  async function patch(item: AnnouncementItem, body: Partial<AnnouncementInput>) {
    try {
      await api(`/api/news/${item.id}`, { method: "PATCH", body: JSON.stringify(body) });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update that notice.");
    }
  }

  async function remove(item: AnnouncementItem) {
    try {
      await api(`/api/news/${item.id}`, { method: "DELETE" });
      setPendingDelete(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not remove that notice.");
    }
  }

  return (
    <div>
      <PageIntro
        kicker="News"
        title="Announcements and newsletters"
        body="Draft, schedule, publish, or archive notices. Urgent notices, general updates, and term newsletters each keep their own priority."
      />

      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center">
        <label className="relative flex-1">
          <span className="sr-only">Search announcements</span>
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink/40" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search headlines and copy" className={`${controlClass} pl-9`} />
        </label>
        <select aria-label="Priority" className={controlClass} value={priority} onChange={(event) => setPriority(event.target.value)}>
          <option value="all">All priorities</option>
          {PRIORITIES.map((value) => (
            <option key={value} value={value}>{PRIORITY_LABELS[value]}</option>
          ))}
        </select>
        <select aria-label="Status" className={controlClass} value={status} onChange={(event) => setStatus(event.target.value)}>
          <option value="all">All statuses</option>
          {ANNOUNCEMENT_STATUSES.map((value) => (
            <option key={value} value={value}>{ANNOUNCEMENT_STATUS_LABELS[value]}</option>
          ))}
        </select>
        <button type="button" className={buttonClass("primary")} disabled={!canWrite} onClick={() => { setEditing(null); setForm(blank()); setFormError(null); setOpen(true); }}>
          <Plus size={16} /> New notice
        </button>
      </div>

      <ErrorNote message={error} />
      <p className="mb-3 text-xs text-ink/60 dark:text-emerald-100/60">{loading ? "Loading…" : `${items.length} ${items.length === 1 ? "notice" : "notices"}`}</p>

      {pendingDelete ? (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-950">
          <p>Remove “{pendingDelete.title}”?</p>
          <div className="flex gap-2">
            <button type="button" className={buttonClass("danger")} onClick={() => void remove(pendingDelete)}>Remove</button>
            <button type="button" className={buttonClass("secondary")} onClick={() => setPendingDelete(null)}>Keep</button>
          </div>
        </div>
      ) : null}

      {items.length === 0 && !loading ? (
        <EmptyState title="No notices match" body="Publish a fees reminder, a timetable, or hold a term newsletter until its date." />
      ) : (
        <div className="space-y-3">
          {items.map((item) => {
            const phase = announcementPhase(item);
            const priorityKey = item.priority as AnnouncementInput["priority"];
            return (
              <article key={item.id} className="rounded-2xl border border-forest-900/10 bg-white p-5 dark:border-white/10 dark:bg-[#102117]">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap gap-2">
                      <Badge tone={priorityTone[priorityKey] ?? "neutral"}>{PRIORITY_LABELS[priorityKey] ?? item.priority}</Badge>
                      <Badge tone={phaseTone[phase]}>{phase === "scheduled" ? "Scheduled" : ANNOUNCEMENT_STATUS_LABELS[item.status as AnnouncementInput["status"]] ?? phase}</Badge>
                    </div>
                    <h2 className="mt-2 font-serif text-2xl text-forest-900 dark:text-white">{item.title}</h2>
                    <p className="mt-1 text-xs text-ink/50">Publishes {formatDateTime(item.publishAt)}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" className={buttonClass("secondary")} disabled={!canWrite} onClick={() => {
                      setEditing(item);
                      setForm({
                        title: item.title,
                        body: item.body,
                        priority: item.priority as NewsForm["priority"],
                        status: item.status as NewsForm["status"],
                        publishAt: toDateTimeInput(item.publishAt),
                      });
                      setFormError(null);
                      setOpen(true);
                    }}>
                      <Pencil size={14} /> Edit
                    </button>
                    {item.status !== "published" ? (
                      <button type="button" className={buttonClass("ghost")} disabled={!canWrite} onClick={() => void patch(item, { status: "published" })}>Publish</button>
                    ) : null}
                    {item.status !== "archived" ? (
                      <button type="button" className={buttonClass("ghost")} disabled={!canWrite} onClick={() => void patch(item, { status: "archived" })}>
                        <Archive size={14} /> Archive
                      </button>
                    ) : (
                      <button type="button" className={buttonClass("ghost")} disabled={!canWrite} onClick={() => void patch(item, { status: "draft" })}>Return to draft</button>
                    )}
                    <button type="button" className={buttonClass("ghost")} disabled={!canWrite} onClick={() => setPendingDelete(item)}>
                      <Trash2 size={14} /> Delete
                    </button>
                  </div>
                </div>
                <div
                  className="mt-4 flex max-w-3xl flex-col gap-2 text-sm leading-6 text-ink/80 dark:text-emerald-50/80 [&_a]:underline [&_ul]:list-disc [&_ul]:pl-5"
                  dangerouslySetInnerHTML={{ __html: renderRichText(item.body) }}
                />
              </article>
            );
          })}
        </div>
      )}

      <Drawer open={open} title={editing ? "Edit announcement" : "New announcement"} onClose={() => setOpen(false)}>
        <form className="space-y-4" onSubmit={(event) => void onSubmit(event)}>
          <ErrorNote message={formError} />
          <Field label="Headline">
            <input className={controlClass} value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} required />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Priority">
              <select className={controlClass} value={form.priority} onChange={(event) => setForm({ ...form, priority: event.target.value as NewsForm["priority"] })}>
                {PRIORITIES.map((value) => (
                  <option key={value} value={value}>{PRIORITY_LABELS[value]}</option>
                ))}
              </select>
            </Field>
            <Field label="Status">
              <select className={controlClass} value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as NewsForm["status"] })}>
                {ANNOUNCEMENT_STATUSES.map((value) => (
                  <option key={value} value={value}>{ANNOUNCEMENT_STATUS_LABELS[value]}</option>
                ))}
              </select>
            </Field>
          </div>
          <Field label="Publish date" hint="Times are East Africa Time. A future date keeps a published notice scheduled until then.">
            <input type="datetime-local" className={controlClass} value={form.publishAt} onChange={(event) => setForm({ ...form, publishAt: event.target.value })} required />
          </Field>
          <Field label="Notice">
            <RichTextEditor value={form.body} onChange={(body) => setForm({ ...form, body })} />
          </Field>
          <button type="submit" className={buttonClass("primary")} disabled={saving || !canWrite}>
            {saving ? "Saving…" : "Save notice"}
          </button>
        </form>
      </Drawer>
    </div>
  );
}
