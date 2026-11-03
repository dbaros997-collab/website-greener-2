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
import { DEPARTMENTS, STAFF_GROUPS, STAFF_GROUP_LABELS } from "@/lib/constants";
import { initials } from "@/lib/format";
import type { StaffInput } from "@/lib/schemas";
import type { StaffProfile } from "@/lib/types";
import { Pencil, Plus, Search, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

function blank(): StaffInput {
  return {
    name: "",
    title: "",
    department: "Academics",
    bio: "",
    photoUrl: "",
    email: "",
    phone: "",
    staffGroup: "teaching",
    visible: true,
  };
}

export function StaffManager() {
  const { session } = useDeskSession();
  const canWrite = session?.canWrite ?? false;
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState("all");
  const [department, setDepartment] = useState("all");
  const [knownDepartments, setKnownDepartments] = useState<string[]>([...DEPARTMENTS]);
  const debounced = useDebounced(query);
  const [items, setItems] = useState<StaffProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<StaffProfile | null>(null);
  const [form, setForm] = useState<StaffInput>(blank());
  const [saving, setSaving] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<StaffProfile | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (debounced) params.set("q", debounced);
      if (group !== "all") params.set("group", group);
      if (department !== "all") params.set("department", department);
      const data = await api<{ items: StaffProfile[] }>(`/api/staff?${params}`);
      setItems(data.items);
      setKnownDepartments((current) =>
        Array.from(new Set([...current, ...data.items.map((item) => item.department)])).sort((a, b) => a.localeCompare(b)),
      );
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load the directory.");
    } finally {
      setLoading(false);
    }
  }, [debounced, group, department]);

  useEffect(() => {
    void load();
  }, [load]);

  function fromProfile(item: StaffProfile): StaffInput {
    return {
      name: item.name,
      title: item.title,
      department: item.department,
      bio: item.bio,
      photoUrl: item.photoUrl,
      email: item.email,
      phone: item.phone,
      staffGroup: item.staffGroup as StaffInput["staffGroup"],
      visible: item.visible,
    };
  }

  async function onUpload(file: File) {
    if (!file.type.startsWith("image/")) {
      setFormError("Staff photos need to be images.");
      return;
    }
    const body = new FormData();
    body.set("file", file);
    const result = await api<{ url: string }>("/api/upload", { method: "POST", body });
    setForm((current) => ({ ...current, photoUrl: result.url }));
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setFormError(null);
    try {
      const body = JSON.stringify(form);
      if (editing) await api(`/api/staff/${editing.id}`, { method: "PATCH", body });
      else await api("/api/staff", { method: "POST", body });
      setOpen(false);
      await load();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Could not save.");
    } finally {
      setSaving(false);
    }
  }

  async function remove(item: StaffProfile) {
    try {
      await api(`/api/staff/${item.id}`, { method: "DELETE" });
      setPendingDelete(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not remove that profile.");
    }
  }

  return (
    <div>
      <PageIntro
        kicker="Directory"
        title="Staff and faculty"
        body="Teaching staff and administration for the Gayaza campus. Profiles already on the public site are loaded here so they can be revised."
      />

      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center">
        <label className="relative flex-1">
          <span className="sr-only">Search staff</span>
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink/40" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search name, title, or department" className={`${controlClass} pl-9`} />
        </label>
        <select aria-label="Group" className={controlClass} value={group} onChange={(event) => setGroup(event.target.value)}>
          <option value="all">Teaching and administration</option>
          {STAFF_GROUPS.map((value) => (
            <option key={value} value={value}>{STAFF_GROUP_LABELS[value]}</option>
          ))}
        </select>
        <select aria-label="Department" className={controlClass} value={department} onChange={(event) => setDepartment(event.target.value)}>
          <option value="all">All departments</option>
          {knownDepartments.map((value) => (
            <option key={value} value={value}>{value}</option>
          ))}
        </select>
        <button type="button" className={buttonClass("primary")} disabled={!canWrite} onClick={() => { setEditing(null); setForm(blank()); setFormError(null); setOpen(true); }}>
          <Plus size={16} /> Add profile
        </button>
      </div>

      <ErrorNote message={error} />
      <p className="mb-3 text-xs text-ink/60 dark:text-emerald-100/60">{loading ? "Loading…" : `${items.length} ${items.length === 1 ? "profile" : "profiles"}`}</p>

      {pendingDelete ? (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-950">
          <p>Remove {pendingDelete.name} from the directory?</p>
          <div className="flex gap-2">
            <button type="button" className={buttonClass("danger")} onClick={() => void remove(pendingDelete)}>Remove</button>
            <button type="button" className={buttonClass("secondary")} onClick={() => setPendingDelete(null)}>Keep</button>
          </div>
        </div>
      ) : null}

      {items.length === 0 && !loading ? (
        <EmptyState title="No profiles match" body="Add a teacher or an office, or clear the department filter." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {items.map((item) => (
            <article key={item.id} className="flex gap-4 rounded-2xl border border-forest-900/10 bg-white p-4 dark:border-white/10 dark:bg-[#102117]">
              {item.photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.photoUrl} alt="" className="h-24 w-20 rounded-xl object-cover" />
              ) : (
                <div className="flex h-24 w-20 items-center justify-center rounded-xl bg-forest-900 font-serif text-xl text-gold-300">
                  {initials(item.name)}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap gap-2">
                  <Badge>{STAFF_GROUP_LABELS[item.staffGroup as StaffInput["staffGroup"]] ?? item.staffGroup}</Badge>
                  {item.visible ? <Badge tone="green">Visible</Badge> : <Badge tone="ink">Hidden</Badge>}
                </div>
                <h2 className="mt-2 font-serif text-xl text-forest-900 dark:text-white">{item.name}</h2>
                <p className="text-sm font-medium text-forest-800 dark:text-gold-300">{item.title}</p>
                <p className="text-xs text-ink/60 dark:text-emerald-100/60">{item.department}</p>
                <p className="mt-2 line-clamp-3 text-sm text-ink/75 dark:text-emerald-50/80">{item.bio}</p>
                <p className="mt-2 text-xs text-ink/50">{[item.email, item.phone].filter(Boolean).join(" · ") || "No contact on file"}</p>
                <div className="mt-3 flex gap-2">
                  <button type="button" className={buttonClass("secondary")} disabled={!canWrite} onClick={() => { setEditing(item); setForm(fromProfile(item)); setFormError(null); setOpen(true); }}>
                    <Pencil size={14} /> Edit
                  </button>
                  <button type="button" className={buttonClass("ghost")} disabled={!canWrite} onClick={() => setPendingDelete(item)}>
                    <Trash2 size={14} /> Delete
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      <Drawer open={open} title={editing ? "Edit profile" : "New profile"} onClose={() => setOpen(false)}>
        <form className="space-y-4" onSubmit={(event) => void onSubmit(event)}>
          <ErrorNote message={formError} />
          <Field label="Name">
            <input className={controlClass} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Title">
              <input className={controlClass} value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} required />
            </Field>
            <Field label="Department">
              <input className={controlClass} list="departments" value={form.department} onChange={(event) => setForm({ ...form, department: event.target.value })} required />
              <datalist id="departments">
                {knownDepartments.map((value) => (
                  <option key={value} value={value} />
                ))}
              </datalist>
            </Field>
          </div>
          <Field label="Group">
            <select className={controlClass} value={form.staffGroup} onChange={(event) => setForm({ ...form, staffGroup: event.target.value as StaffInput["staffGroup"] })}>
              {STAFF_GROUPS.map((value) => (
                <option key={value} value={value}>{STAFF_GROUP_LABELS[value]}</option>
              ))}
            </select>
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Email">
              <input type="email" className={controlClass} value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
            </Field>
            <Field label="Phone">
              <input className={controlClass} value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} />
            </Field>
          </div>
          <Field label="Photo">
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className={controlClass}
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void onUpload(file).catch((err) => setFormError(err instanceof Error ? err.message : "Upload failed."));
              }}
            />
          </Field>
          <Field label="Photo link">
            <input className={controlClass} value={form.photoUrl} onChange={(event) => setForm({ ...form, photoUrl: event.target.value })} />
          </Field>
          {form.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={form.photoUrl} alt="" className="h-32 w-24 rounded-xl object-cover" />
          ) : null}
          <Field label="Bio">
            <textarea className={controlClass} rows={5} value={form.bio} onChange={(event) => setForm({ ...form, bio: event.target.value })} />
          </Field>
          <label className="flex items-center gap-2 text-sm font-medium">
            <input type="checkbox" checked={form.visible} onChange={(event) => setForm({ ...form, visible: event.target.checked })} />
            Show on the public directory
          </label>
          <button type="submit" className={buttonClass("primary")} disabled={saving || !canWrite}>
            {saving ? "Saving…" : "Save profile"}
          </button>
        </form>
      </Drawer>
    </div>
  );
}
