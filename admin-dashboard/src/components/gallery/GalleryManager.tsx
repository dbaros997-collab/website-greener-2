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
  GALLERY_CATEGORIES,
  GALLERY_CATEGORY_LABELS,
  GALLERY_STATUS_LABELS,
  GALLERY_STATUSES,
} from "@/lib/constants";
import { formatDate, mediaPoster } from "@/lib/format";
import type { GalleryInput } from "@/lib/schemas";
import type { GalleryItem } from "@/lib/types";
import { Archive, Pencil, Plus, Search, Star, Trash2, Upload } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

const blank = (): GalleryInput => ({
  title: "",
  description: "",
  category: "campus_life",
  mediaType: "image",
  mediaUrl: "",
  takenOn: new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Kampala",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date()),
  featured: false,
  status: "published",
});

export function GalleryManager() {
  const { session } = useDeskSession();
  const canWrite = session?.canWrite ?? false;
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState("all");
  const debounced = useDebounced(query);
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<GalleryItem | null>(null);
  const [form, setForm] = useState<GalleryInput>(blank());
  const [saving, setSaving] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<GalleryItem | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (debounced) params.set("q", debounced);
      if (category !== "all") params.set("category", category);
      if (status !== "all") params.set("status", status);
      const data = await api<{ items: GalleryItem[] }>(`/api/gallery?${params}`);
      setItems(data.items);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load the gallery.");
    } finally {
      setLoading(false);
    }
  }, [debounced, category, status]);

  useEffect(() => {
    void load();
  }, [load]);

  function openNew() {
    setEditing(null);
    setForm(blank());
    setFormError(null);
    setOpen(true);
  }

  function openEdit(item: GalleryItem) {
    setEditing(item);
    setForm({
      title: item.title,
      description: item.description,
      category: item.category as GalleryInput["category"],
      mediaType: item.mediaType as GalleryInput["mediaType"],
      mediaUrl: item.mediaUrl,
      takenOn: item.takenOn,
      featured: item.featured,
      status: item.status as GalleryInput["status"],
    });
    setFormError(null);
    setOpen(true);
  }

  async function onUpload(file: File) {
    const body = new FormData();
    body.set("file", file);
    const result = await api<{ url: string; mediaType: "image" | "video" }>("/api/upload", { method: "POST", body });
    setForm((current) => ({ ...current, mediaUrl: result.url, mediaType: result.mediaType }));
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setFormError(null);
    try {
      if (editing) {
        await api(`/api/gallery/${editing.id}`, { method: "PATCH", body: JSON.stringify(form) });
      } else {
        await api("/api/gallery", { method: "POST", body: JSON.stringify(form) });
      }
      setOpen(false);
      await load();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Could not save.");
    } finally {
      setSaving(false);
    }
  }

  async function patch(item: GalleryItem, body: Partial<GalleryInput>) {
    try {
      await api(`/api/gallery/${item.id}`, { method: "PATCH", body: JSON.stringify(body) });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update that item.");
    }
  }

  async function remove(item: GalleryItem) {
    try {
      await api(`/api/gallery/${item.id}`, { method: "DELETE" });
      setPendingDelete(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not remove that item.");
    }
  }

  const poster = mediaPoster(form.mediaType, form.mediaUrl);

  return (
    <div>
      <PageIntro
        kicker="Gallery"
        title="Campus pictures and film"
        body="Upload images or videos, filter by Sports, Academics, Campus Life, Events, and Ceremonies, and choose what is featured on the public landing feed."
      />

      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-1 flex-col gap-2 sm:flex-row">
          <label className="relative flex-1">
            <span className="sr-only">Search gallery</span>
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink/40" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search titles and descriptions"
              className={`${controlClass} pl-9`}
            />
          </label>
          <select aria-label="Category" className={controlClass} value={category} onChange={(event) => setCategory(event.target.value)}>
            <option value="all">All categories</option>
            {GALLERY_CATEGORIES.map((value) => (
              <option key={value} value={value}>{GALLERY_CATEGORY_LABELS[value]}</option>
            ))}
          </select>
          <select aria-label="Status" className={controlClass} value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="all">All statuses</option>
            {GALLERY_STATUSES.map((value) => (
              <option key={value} value={value}>{GALLERY_STATUS_LABELS[value]}</option>
            ))}
          </select>
        </div>
        <button type="button" className={buttonClass("primary")} disabled={!canWrite} onClick={openNew}>
          <Plus size={16} />
          Add item
        </button>
      </div>

      <ErrorNote message={error} />
      <p className="mb-3 text-xs text-ink/60 dark:text-emerald-100/60">{loading ? "Loading…" : `${items.length} ${items.length === 1 ? "item" : "items"}`}</p>

      {pendingDelete ? (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-950">
          <p>Remove “{pendingDelete.title}” from the gallery?</p>
          <div className="flex gap-2">
            <button type="button" className={buttonClass("danger")} onClick={() => void remove(pendingDelete)}>Remove</button>
            <button type="button" className={buttonClass("secondary")} onClick={() => setPendingDelete(null)}>Keep</button>
          </div>
        </div>
      ) : null}

      {items.length === 0 && !loading ? (
        <EmptyState title="No gallery items match" body="Try another category, or add a photograph from a ceremony, a match, or a campus afternoon." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => {
            const image = mediaPoster(item.mediaType, item.mediaUrl);
            return (
              <article key={item.id} className="overflow-hidden rounded-2xl border border-forest-900/10 bg-white dark:border-white/10 dark:bg-[#102117]">
                {image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={image} alt="" className="h-44 w-full object-cover" />
                ) : (
                  <div className="flex h-44 items-center justify-center bg-forest-900 text-sm text-gold-300">Video link</div>
                )}
                <div className="space-y-3 p-4">
                  <div className="flex flex-wrap gap-2">
                    <Badge>{GALLERY_CATEGORY_LABELS[item.category as GalleryInput["category"]] ?? item.category}</Badge>
                    <Badge tone={item.status === "published" ? "green" : item.status === "archived" ? "ink" : "gold"}>
                      {GALLERY_STATUS_LABELS[item.status as GalleryInput["status"]] ?? item.status}
                    </Badge>
                    {item.featured ? <Badge tone="gold">Landing page</Badge> : null}
                  </div>
                  <div>
                    <h2 className="font-serif text-xl text-forest-900 dark:text-white">{item.title}</h2>
                    <p className="mt-1 line-clamp-2 text-sm text-ink/70 dark:text-emerald-100/70">{item.description}</p>
                    <p className="mt-2 text-xs text-ink/50">{formatDate(item.takenOn)} · {item.mediaType}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" className={buttonClass("secondary")} disabled={!canWrite} onClick={() => openEdit(item)}>
                      <Pencil size={14} /> Edit
                    </button>
                    <button
                      type="button"
                      className={buttonClass("ghost")}
                      disabled={!canWrite}
                      onClick={() => void patch(item, { featured: !item.featured })}
                    >
                      <Star size={14} /> {item.featured ? "Unfeature" : "Feature"}
                    </button>
                    <button
                      type="button"
                      className={buttonClass("ghost")}
                      disabled={!canWrite}
                      onClick={() => void patch(item, { status: item.status === "archived" ? "published" : "archived", featured: false })}
                    >
                      <Archive size={14} /> {item.status === "archived" ? "Restore" : "Archive"}
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
      )}

      <Drawer open={open} title={editing ? "Edit gallery item" : "New gallery item"} onClose={() => setOpen(false)}>
        <form className="space-y-4" onSubmit={(event) => void onSubmit(event)}>
          <ErrorNote message={formError} />
          <Field label="Title">
            <input className={controlClass} value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} required />
          </Field>
          <Field label="Description">
            <textarea className={controlClass} rows={4} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Category">
              <select className={controlClass} value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value as GalleryInput["category"] })}>
                {GALLERY_CATEGORIES.map((value) => (
                  <option key={value} value={value}>{GALLERY_CATEGORY_LABELS[value]}</option>
                ))}
              </select>
            </Field>
            <Field label="Date">
              <input type="date" className={controlClass} value={form.takenOn} onChange={(event) => setForm({ ...form, takenOn: event.target.value })} required />
            </Field>
          </div>
          <Field label="File" hint="JPEG, PNG, WebP, GIF up to 12 MB, or MP4/WebM up to 40 MB. You can also paste a link.">
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm"
              className={controlClass}
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void onUpload(file).catch((err) => setFormError(err instanceof Error ? err.message : "Upload failed."));
              }}
            />
          </Field>
          <Field label="Media link">
            <input className={controlClass} value={form.mediaUrl} onChange={(event) => setForm({ ...form, mediaUrl: event.target.value })} placeholder="https:// or /uploads/…" />
          </Field>
          <Field label="Media type">
            <select className={controlClass} value={form.mediaType} onChange={(event) => setForm({ ...form, mediaType: event.target.value as GalleryInput["mediaType"] })}>
              <option value="image">Image</option>
              <option value="video">Video</option>
            </select>
          </Field>
          {poster ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={poster} alt="" className="h-40 w-full rounded-xl object-cover" />
          ) : null}
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Website status">
              <select className={controlClass} value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as GalleryInput["status"] })}>
                {GALLERY_STATUSES.map((value) => (
                  <option key={value} value={value}>{GALLERY_STATUS_LABELS[value]}</option>
                ))}
              </select>
            </Field>
            <label className="mt-7 flex items-center gap-2 text-sm font-medium">
              <input type="checkbox" checked={form.featured} onChange={(event) => setForm({ ...form, featured: event.target.checked })} />
              Feature on the landing page
            </label>
          </div>
          <button type="submit" className={buttonClass("primary")} disabled={saving || !canWrite}>
            <Upload size={16} />
            {saving ? "Saving…" : "Save item"}
          </button>
        </form>
      </Drawer>
    </div>
  );
}
