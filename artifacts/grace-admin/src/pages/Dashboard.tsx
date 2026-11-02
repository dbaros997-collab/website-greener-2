import { useState } from "react";
import { cn } from "@/lib/utils";
import { DashboardContent } from "@/pages/DashboardContent";

const TABS: { id: string; label: string }[] = [
  { id: "news", label: "News Ticker" },
  { id: "stats", label: "Stats" },
  { id: "gallery", label: "Gallery" },
  { id: "testimonials", label: "Testimonials" },
  { id: "videos", label: "Videos" },
  { id: "programmes", label: "Programmes" },
  { id: "values", label: "Values" },
  { id: "admissions", label: "Admission Steps" },
  { id: "section-text", label: "Section Text" },
  { id: "resources", label: "Resources" },
  { id: "applications", label: "Applications" },
  { id: "enquiries", label: "Enquiries" },
];

export default function Dashboard() {
  const [active, setActive] = useState("gallery");

  return (
    <div className="min-h-screen bg-gray-50 text-emerald-950">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-4">
          <div>
            <h1 className="text-lg font-semibold text-emerald-900">Grace Admin Dashboard</h1>
            <p className="text-xs text-muted-foreground">
              Open access dashboard · changes sync to the public site in real time
            </p>
          </div>
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-emerald-800 underline-offset-2 hover:underline"
          >
            Open public site ↗
          </a>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6">
        <div
          role="tablist"
          aria-label="Dashboard sections"
          className="mb-4 flex flex-wrap gap-1 rounded-xl border border-emerald-100 bg-[#e8f3ec] p-1.5"
        >
          {TABS.map((tab) => {
            const selected = active === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => setActive(tab.id)}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                  selected
                    ? "bg-white text-emerald-950 shadow-sm"
                    : "text-emerald-900/70 hover:bg-white/70",
                )}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <DashboardContent section={active} />
      </main>
    </div>
  );
}
