"use client";

import { renderRichText } from "@/lib/rich-text";
import { useRef } from "react";

const ACTIONS = [
  { label: "Bold", before: "**", after: "**" },
  { label: "Italic", before: "_", after: "_" },
  { label: "Heading", before: "## ", after: "" },
  { label: "List", before: "- ", after: "" },
];

export function RichTextEditor({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const ref = useRef<HTMLTextAreaElement>(null);

  function insert(before: string, after: string) {
    const field = ref.current;
    if (!field) return;
    const start = field.selectionStart;
    const end = field.selectionEnd;
    const next = value.slice(0, start) + before + value.slice(start, end) + after + value.slice(end);
    onChange(next);
    requestAnimationFrame(() => {
      field.focus();
      field.selectionStart = start + before.length;
      field.selectionEnd = end + before.length;
    });
  }

  return (
    <div className="grid gap-3 lg:grid-cols-2">
      <div>
        <div className="mb-2 flex flex-wrap gap-1">
          {ACTIONS.map((action) => (
            <button
              key={action.label}
              type="button"
              className="rounded-md border border-forest-900/15 px-2 py-1 text-xs font-semibold dark:border-white/15"
              onClick={() => insert(action.before, action.after)}
            >
              {action.label}
            </button>
          ))}
        </div>
        <textarea
          ref={ref}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          rows={12}
          className="w-full rounded-lg border border-forest-900/15 bg-white px-3 py-2 text-sm dark:border-white/15 dark:bg-[#0c1a12]"
          placeholder="Write the notice. Use **bold**, _italic_, ## headings, and - lists."
        />
      </div>
      <div className="rounded-xl border border-forest-900/10 bg-white p-4 dark:border-white/10 dark:bg-[#102117]">
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-forest-700 dark:text-gold-300">Preview</p>
        {value.trim() ? (
          <div
            className="flex flex-col gap-2 text-sm leading-6 [&_a]:underline [&_h3]:font-serif [&_h3]:text-lg [&_ul]:list-disc [&_ul]:pl-5"
            dangerouslySetInnerHTML={{ __html: renderRichText(value) }}
          />
        ) : (
          <p className="text-sm text-ink/60 dark:text-emerald-100/60">The notice preview appears as you write.</p>
        )}
      </div>
    </div>
  );
}
