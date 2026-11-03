"use client";

import { api } from "@/lib/client-api";
import { ROLE_ORDER, sessionFor, type Role, type Session } from "@/lib/permissions";
import {
  CalendarDays,
  ExternalLink,
  Images,
  LayoutDashboard,
  Megaphone,
  Menu,
  Moon,
  PanelLeft,
  School,
  Sun,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createContext, useContext, useEffect, useState } from "react";
import { LIVE_SITE } from "@/lib/constants";
import { formatClock } from "@/lib/format";

const SessionContext = createContext<{
  session: Session | null;
  setRole: (role: Role) => Promise<void>;
} | null>(null);

export function useDeskSession() {
  const value = useContext(SessionContext);
  if (!value) throw new Error("Desk session is only available inside the dashboard shell.");
  return value;
}

const NAV = [
  { href: "/", label: "Overview", icon: LayoutDashboard },
  { href: "/admin", label: "Admin", icon: PanelLeft },
  { href: "/gallery", label: "Gallery", icon: Images },
  { href: "/news", label: "News", icon: Megaphone },
  { href: "/events", label: "Calendar", icon: CalendarDays },
  { href: "/staff", label: "Staff", icon: Users },
];

function ThemeButton() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  function toggle() {
    const next = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("ghs-theme", next ? "dark" : "light");
    setDark(next);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className="inline-flex items-center gap-2 rounded-lg border border-forest-900/10 bg-white px-3 py-2 text-sm font-medium text-forest-900 dark:border-white/15 dark:bg-white/5 dark:text-white"
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {dark ? <Sun size={16} /> : <Moon size={16} />}
      <span className="hidden sm:inline">{dark ? "Light" : "Dark"}</span>
    </button>
  );
}

function CampusClock() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);
  return (
    <time className="tabular-nums text-xs text-ink/70 dark:text-emerald-100/70" dateTime={now?.toISOString()}>
      {now ? formatClock(now) : "Gayaza time"}
    </time>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    let cancelled = false;
    api<{ session: Session }>("/api/session")
      .then((data) => {
        if (!cancelled) setSession(data.session);
      })
      .catch(() => {
        if (!cancelled) setSession(sessionFor("administrator"));
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function setRole(role: Role) {
    const data = await api<{ session: Session }>("/api/session", {
      method: "POST",
      body: JSON.stringify({ role }),
    });
    setSession(data.session);
  }

  const nav = (
    <nav className="flex flex-1 flex-col gap-1 px-3" aria-label="Dashboard">
      {NAV.map((item) => {
        const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium ${
              active ? "bg-white/15 text-gold-300" : "text-white/80 hover:bg-white/10 hover:text-white"
            }`}
          >
            <Icon size={18} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <SessionContext.Provider value={{ session, setRole }}>
      <div className="min-h-screen">
        <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 flex-col bg-forest-900 text-white lg:flex">
          <Brand />
          {nav}
          <RoleCard session={session} onRole={setRole} />
        </aside>

        {open ? (
          <div className="fixed inset-0 z-40 lg:hidden">
            <button type="button" aria-label="Close menu" className="absolute inset-0 bg-forest-950/60" onClick={() => setOpen(false)} />
            <aside className="relative flex h-full w-72 flex-col bg-forest-900 text-white">
              <div className="flex justify-end px-3 pt-3">
                <button type="button" aria-label="Close menu" className="rounded-lg p-2 text-white" onClick={() => setOpen(false)}>
                  <X size={18} />
                </button>
              </div>
              <Brand />
              {nav}
              <RoleCard session={session} onRole={setRole} />
            </aside>
          </div>
        ) : null}

        <div className="lg:pl-72">
          <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-forest-900/10 bg-paper/90 px-4 py-3 backdrop-blur dark:border-white/10 dark:bg-forest-950/90 sm:px-6">
            <div className="flex items-center gap-3">
              <button
                type="button"
                className="rounded-lg border border-forest-900/10 p-2 lg:hidden dark:border-white/15"
                aria-label="Open menu"
                onClick={() => setOpen(true)}
              >
                <Menu size={18} />
              </button>
              <div>
                <p className="text-sm font-semibold text-forest-900 dark:text-white">Content desk</p>
                <CampusClock />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ThemeButton />
              <a
                href={LIVE_SITE}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-lg bg-forest-800 px-3 py-2 text-sm font-semibold text-white dark:bg-gold-500 dark:text-forest-950"
              >
                <ExternalLink size={16} />
                <span className="hidden sm:inline">View website</span>
              </a>
            </div>
          </header>
          {session && !session.canWrite ? (
            <p className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-950 sm:px-6">
              You are on the viewer desk. Switch to Editor or Administrator to change the library.
            </p>
          ) : null}
          <main id="content" className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            {children}
          </main>
        </div>
      </div>
    </SessionContext.Provider>
  );
}

function Brand() {
  return (
    <div className="flex items-center gap-3 px-5 py-6">
      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gold-500 font-serif text-lg font-semibold text-forest-950">
        <School size={20} />
      </span>
      <div>
        <p className="font-serif text-lg leading-tight">Grace High School</p>
        <p className="text-xs text-white/60">Gayaza · content library</p>
      </div>
    </div>
  );
}

function RoleCard({
  session,
  onRole,
}: {
  session: Session | null;
  onRole: (role: Role) => Promise<void>;
}) {
  return (
    <div className="m-3 rounded-2xl border border-white/10 bg-white/5 p-3">
      <label className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-gold-300" htmlFor="desk-role">
        Desk role
      </label>
      <select
        id="desk-role"
        className="mt-2 w-full rounded-lg border border-white/15 bg-forest-950/40 px-2 py-2 text-sm text-white"
        value={session?.role ?? "administrator"}
        disabled={!session}
        onChange={(event) => void onRole(event.target.value as Role)}
      >
        {ROLE_ORDER.map((role) => (
          <option key={role} value={role}>
            {sessionFor(role).label}
          </option>
        ))}
      </select>
      <p className="mt-2 text-xs leading-5 text-white/70">{session?.detail ?? "Checking access…"}</p>
    </div>
  );
}
