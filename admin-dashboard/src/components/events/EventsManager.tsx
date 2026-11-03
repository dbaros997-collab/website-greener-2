"use client";

import { useDeskSession } from "@/components/shell/AppShell";
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
  AUDIENCES,
  AUDIENCE_LABELS,
  EVENT_STATUSES,
  EVENT_STATUS_LABELS,
  EVENT_TYPES,
  EVENT_TYPE_LABELS,
} from "@/lib/constants";
import { formatDateTime, formatMonth, fromDateTimeInput, toDateTimeInput } from "@/lib/format";
import type { EventInput } from "@/lib/schemas";
import type { SchoolEvent } from "@/lib/types";
import { MapPin, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

type EventForm = Omit<EventInput, "startsAt" | "endsAt"> & { startsAt: string; endsAt: string };

function blank(): EventForm {
  const start = toDateTimeInput(new Date().toISOString());
  const end = toDateTimeInput(new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString());
  return {
    title: "",
    description: "",
    eventType: "other",
    venue: "Main Hall, Gayaza campus",
    startsAt: start,
    endsAt: end,
    audiences: ["students"],
    status: "scheduled",
  };
}

export function EventsManager() {
  const { session } = useDeskSession();
  const canWrite = session?.canWrite ?? false;
  const [query, setQuery] = useState("");
  const [eventType, setEventType] = useState("all");
  const [audience, setAudience] = useState("all");
  const [status, setStatus] = useState("all");
  const debounced = useDebounced(query);
  const [items, setItems] = useState<SchoolEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<SchoolEvent | null>(null);
  const [form, setForm] = useState<EventForm>(blank());
  const [saving, setSaving] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<SchoolEvent | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (debounced) params.set("q", debounced);
      if (eventType !== "all") params.set("type", eventType);
      if (audience !== "all") params.set("audience", audience);
      if (status !== "all") params.set("status", status);
      const data = await api<{ items: SchoolEvent[] }>(`/api/events?${params}`);
      setItems(data.items);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load the calendar.");
    } finally {
      setLoading(false);
    }
  }, [debounced, eventType, audience, status]);

  useEffect(() => {
    void load();
  }, [load]);

  function toggleAudience(value: EventInput["audiences"][number]) {
    setForm((current) => {
      const has = current.audiences.includes(value);
      const audiences = has ? current.audiences.filter((item) => item !== value) : [...current.audiences, value];
      return { ...current, audiences };
    });
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setFormError(null);
    try {
      const body = JSON.stringify({
        ...form,
        startsAt: fromDateTimeInput(form.startsAt),
        endsAt: fromDateTimeInput(form.endsAt),
      });
      if (editing) await api(`/api/events/${editing.id}`, { method: "PATCH", body });
      else await api("/api/events", { method: "POST", body });
      setOpen(false);
      await load();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Could not save.");
    } finally {
      setSaving(false);
    }
  }

  async function remove(item: SchoolEvent) {
    try {
      await api(`/api/events/${item.id}`, { method: "DELETE" });
      setPendingDelete(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not remove that event.");
    }
  }

  const groups = new Map<string, SchoolEvent[]>();
  for (const item of items) {
    const key = formatMonth(item.startsAt);
    groups.set(key, [...(groups.get(key) ?? []), item]);
  }

  return (
    <div>
      <PageIntro
        kicker="Calendar"
        title="School events"
        body="Term opening and closing, Sports Day, Open Day, and examinations. Each entry has a venue, East Africa times, and an audience of parents, students, or the public."
      />

      <div className="mb-4 flex flex-col gap-3 xl:flex-row xl:items-center">
        <label className="relative min-w-0 flex-1">
          <span className="sr-only">Search events</span>
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink/40" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search events or venues" className={`${controlClass} pl-9`} />
        </label>
        <select aria-label="Event type" className={controlClass} value={eventType} onChange={(event) => setEventType(event.target.value)}>
          <option value="all">All types</option>
          {EVENT_TYPES.map((value) => (
            <option key={value} value={value}>{EVENT_TYPE_LABELS[value]}</option>
          ))}
        </select>
        <select aria-label="Audience" className={controlClass} value={audience} onChange={(event) => setAudience(event.target.value)}>
          <option value="all">All audiences</option>
          {AUDIENCES.map((value) => (
            <option key={value} value={value}>{AUDIENCE_LABELS[value]}</option>
          ))}
        </select>
        <select aria-label="Status" className={controlClass} value={status} onChange={(event) => setStatus(event.target.value)}>
          <option value="all">All statuses</option>
          {EVENT_STATUSES.map((value) => (
            <option key={value} value={value}>{EVENT_STATUS_LABELS[value]}</option>
          ))}
        </select>
        <button type="button" className={buttonClass("primary")} disabled={!canWrite} onClick={() => { setEditing(null); setForm(blank()); setFormError(null); setOpen(true); }}>
          <Plus size={16} /> Schedule
        </button>
      </div>

      <ErrorNote message={error} />
      <p className="mb-3 text-xs text-ink/60 dark:text-emerald-100/60">{loading ? "Loading…" : `${items.length} ${items.length === 1 ? "event" : "events"}`}</p>

      {pendingDelete ? (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-950">
          <p>Remove “{pendingDelete.title}” from the calendar?</p>
          <div className="flex gap-2">
            <button type="button" className={buttonClass("danger")} onClick={() => void remove(pendingDelete)}>Remove</button>
            <button type="button" className={buttonClass("secondary")} onClick={() => setPendingDelete(null)}>Keep</button>
          </div>
        </div>
      ) : null}

      {items.length === 0 && !loading ? (
        <EmptyState title="The calendar is clear" body="Schedule a term date, an examination window, or an open morning for families." />
      ) : (
        <div className="space-y-6">
          {[...groups.entries()].map(([month, events]) => (
            <section key={month}>
              <h2 className="mb-3 font-serif text-2xl text-forest-900 dark:text-white">{month}</h2>
              <div className="space-y-3">
                {events.map((item) => {
                  const type = item.eventType as EventInput["eventType"];
                  const state = item.status as EventInput["status"];
                  return (
                    <article key={item.id} className="rounded-2xl border border-forest-900/10 bg-white p-5 dark:border-white/10 dark:bg-[#102117]">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <div className="flex flex-wrap gap-2">
                            <Badge tone="green">{EVENT_TYPE_LABELS[type] ?? item.eventType}</Badge>
                            <Badge tone={state === "cancelled" ? "rose" : state === "completed" ? "ink" : "gold"}>{EVENT_STATUS_LABELS[state] ?? item.status}</Badge>
                            {item.audiences.map((tag) => (
                              <Badge key={tag}>{AUDIENCE_LABELS[tag] ?? tag}</Badge>
                            ))}
                          </div>
                          <h3 className="mt-2 font-serif text-2xl text-forest-900 dark:text-white">{item.title}</h3>
                          <p className="mt-1 text-sm text-ink/70 dark:text-emerald-100/70">{item.description}</p>
                          <p className="mt-2 flex items-center gap-2 text-sm">
                            <MapPin size={14} /> {item.venue}
                          </p>
                          <p className="mt-1 text-xs text-ink/50">{formatDateTime(item.startsAt)} – {formatDateTime(item.endsAt)}</p>
                        </div>
                        <div className="flex gap-2">
                          <button type="button" className={buttonClass("secondary")} disabled={!canWrite} onClick={() => {
                            setEditing(item);
                            setForm({
                              title: item.title,
                              description: item.description,
                              eventType: item.eventType as EventForm["eventType"],
                              venue: item.venue,
                              startsAt: toDateTimeInput(item.startsAt),
                              endsAt: toDateTimeInput(item.endsAt),
                              audiences: item.audiences,
                              status: item.status as EventForm["status"],
                            });
                            setFormError(null);
                            setOpen(true);
                          }}>
                            <Pencil size={14} /> Edit
                          </button>
                          <button type="button" className={buttonClass("ghost")} disabled={!canWrite} onClick={() => setPendingDelete(item)}>
                            <Trash2 size={14} /> Delete
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}

      <Drawer open={open} title={editing ? "Edit event" : "Schedule an event"} onClose={() => setOpen(false)}>
        <form className="space-y-4" onSubmit={(event) => void onSubmit(event)}>
          <ErrorNote message={formError} />
          <Field label="Event name">
            <input className={controlClass} value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} required />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Type">
              <select className={controlClass} value={form.eventType} onChange={(event) => setForm({ ...form, eventType: event.target.value as EventForm["eventType"] })}>
                {EVENT_TYPES.map((value) => (
                  <option key={value} value={value}>{EVENT_TYPE_LABELS[value]}</option>
                ))}
              </select>
            </Field>
            <Field label="Status">
              <select className={controlClass} value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as EventForm["status"] })}>
                {EVENT_STATUSES.map((value) => (
                  <option key={value} value={value}>{EVENT_STATUS_LABELS[value]}</option>
                ))}
              </select>
            </Field>
          </div>
          <Field label="Venue">
            <input className={controlClass} value={form.venue} onChange={(event) => setForm({ ...form, venue: event.target.value })} required />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Starts" hint="East Africa Time">
              <input type="datetime-local" className={controlClass} value={form.startsAt} onChange={(event) => setForm({ ...form, startsAt: event.target.value })} required />
            </Field>
            <Field label="Ends">
              <input type="datetime-local" className={controlClass} value={form.endsAt} onChange={(event) => setForm({ ...form, endsAt: event.target.value })} required />
            </Field>
          </div>
          <Field label="Audience">
            <div className="flex flex-wrap gap-2">
              {AUDIENCES.map((value) => {
                const selected = form.audiences.includes(value);
                return (
                  <button
                    key={value}
                    type="button"
                    aria-pressed={selected}
                    className={selected ? buttonClass("primary") : buttonClass("secondary")}
                    onClick={() => toggleAudience(value)}
                  >
                    {AUDIENCE_LABELS[value]}
                  </button>
                );
              })}
            </div>
          </Field>
          <Field label="Notes">
            <textarea className={controlClass} rows={4} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
          </Field>
          <button type="submit" className={buttonClass("primary")} disabled={saving || !canWrite}>
            {saving ? "Saving…" : "Save event"}
          </button>
        </form>
      </Drawer>
    </div>
  );
}
