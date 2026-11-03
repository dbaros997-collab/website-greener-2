"use client";

import { X } from "lucide-react";
import { useEffect } from "react";

export function buttonClass(kind: "primary" | "secondary" | "ghost" | "danger" = "primary") {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-lg px-3.5 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50";
  const kinds = {
    primary: "bg-forest-800 text-white hover:bg-forest-900 dark:bg-gold-500 dark:text-forest-950 dark:hover:bg-gold-300",
    secondary:
      "border border-forest-900/15 bg-white text-forest-900 hover:bg-forest-100 dark:border-white/15 dark:bg-white/5 dark:text-white dark:hover:bg-white/10",
    ghost: "text-forest-800 hover:bg-forest-100 dark:text-emerald-50 dark:hover:bg-white/10",
    danger: "bg-rose-700 text-white hover:bg-rose-800",
  };
  return `${base} ${kinds[kind]}`;
}

export const controlClass =
  "w-full rounded-lg border border-forest-900/15 bg-white px-3 py-2 text-sm text-ink outline-none focus-visible:outline-gold-500 dark:border-white/15 dark:bg-[#0c1a12] dark:text-emerald-50";

const tones = {
  neutral: "bg-forest-100 text-forest-900 dark:bg-white/10 dark:text-emerald-50",
  green: "bg-emerald-100 text-emerald-950 dark:bg-emerald-400/15 dark:text-emerald-100",
  gold: "bg-amber-100 text-amber-950 dark:bg-gold-500/20 dark:text-gold-300",
  rose: "bg-rose-100 text-rose-900 dark:bg-rose-400/15 dark:text-rose-100",
  ink: "bg-forest-900 text-white",
};

export function Badge({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: keyof typeof tones;
}) {
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${tones[tone]}`}>
      {children}
    </span>
  );
}

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <span className="mb-1.5 block text-sm font-medium">{label}</span>
      {children}
      {hint ? <span className="mt-1 block text-xs text-ink/60 dark:text-emerald-100/60">{hint}</span> : null}
    </div>
  );
}

export function Drawer({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button type="button" aria-label="Close panel" className="absolute inset-0 bg-forest-950/50" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative flex h-full w-full max-w-xl flex-col bg-paper shadow-2xl dark:bg-forest-950"
      >
        <header className="flex items-center justify-between border-b border-forest-900/10 px-5 py-4 dark:border-white/10">
          <h2 className="font-serif text-2xl text-forest-900 dark:text-white">{title}</h2>
          <button type="button" className={buttonClass("ghost")} onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </header>
        <div className="flex-1 overflow-y-auto px-5 py-5">{children}</div>
      </div>
    </div>
  );
}

export function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-forest-900/20 px-6 py-12 text-center dark:border-white/15">
      <h3 className="font-serif text-xl text-forest-900 dark:text-white">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm text-ink/70 dark:text-emerald-100/70">{body}</p>
    </div>
  );
}

export function ErrorNote({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-900 dark:border-rose-400/30 dark:bg-rose-950/40 dark:text-rose-100">
      {message}
    </p>
  );
}

export function PageIntro({
  kicker,
  title,
  body,
}: {
  kicker: string;
  title: string;
  body: string;
}) {
  return (
    <header className="mb-6">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-forest-700 dark:text-gold-300">{kicker}</p>
      <h1 className="mt-1 font-serif text-3xl text-forest-900 dark:text-white sm:text-4xl">{title}</h1>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-ink/70 dark:text-emerald-100/70">{body}</p>
    </header>
  );
}
