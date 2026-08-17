import { setBaseUrl } from "./custom-fetch";

let configured = false;
let cachedApiRoot: string | null = null;

function readViteEnv(key: string): string {
  try {
    const env = (import.meta as ImportMeta & { env?: Record<string, string | undefined> })
      .env;
    const value = env?.[key];
    return typeof value === "string" ? value.trim() : "";
  } catch {
    return "";
  }
}

function normalizeOrigin(value: string): string {
  return value.replace(/\/+$/, "");
}

/** Optional VITE_API_BASE_URL, e.g. https://api.example.com (no trailing slash). */
export function resolveApiOrigin(): string | null {
  const raw = readViteEnv("VITE_API_BASE_URL");
  return raw ? normalizeOrigin(raw) : null;
}

/** Wire Orval-generated fetch helpers to a remote API origin (hybrid deploys). */
export function ensureApiClientConfigured(): void {
  if (configured) return;
  setBaseUrl(resolveApiOrigin());
  configured = true;
}

/** `/api` on the same host, or `{VITE_API_BASE_URL}/api` when set. */
export function getApiRoot(): string {
  if (cachedApiRoot) return cachedApiRoot;
  ensureApiClientConfigured();
  const origin = resolveApiOrigin();
  cachedApiRoot = origin ? `${origin}/api` : "/api";
  return cachedApiRoot;
}

/** Prefix for `/api/storage` object URLs in templates and downloads. */
export function getStoragePrefix(): string {
  return `${getApiRoot()}/storage`;
}
