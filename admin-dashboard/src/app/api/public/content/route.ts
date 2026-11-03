import { loadPublicFeed } from "@/lib/public-content";

export const dynamic = "force-dynamic";

const LIVE_ORIGIN = "https://gracehighschoolgayaza.academy";
const WWW_ORIGIN = "https://www.gracehighschoolgayaza.academy";

function allowedOrigin(origin: string | null): string {
  if (!origin) return LIVE_ORIGIN;
  if (origin === LIVE_ORIGIN || origin === WWW_ORIGIN) return origin;
  if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) return origin;
  return LIVE_ORIGIN;
}

function corsHeaders(req: Request): Headers {
  const headers = new Headers();
  headers.set("Access-Control-Allow-Origin", allowedOrigin(req.headers.get("origin")));
  headers.set("Access-Control-Allow-Methods", "GET, OPTIONS");
  headers.set("Access-Control-Allow-Headers", "Accept, Content-Type");
  headers.set("Access-Control-Max-Age", "86400");
  headers.set("Vary", "Origin");
  return headers;
}

export function OPTIONS(req: Request) {
  return new Response(null, { status: 204, headers: corsHeaders(req) });
}

export async function GET(req: Request) {
  const accept = req.headers.get("accept") ?? "";
  const raw = new URL(req.url).searchParams.get("raw") === "1";
  if (!raw && accept.includes("text/html")) {
    const headers = corsHeaders(req);
    headers.set("Location", new URL("/admin", req.url).toString());
    return new Response(null, { status: 307, headers });
  }

  const feed = await loadPublicFeed();
  const headers = corsHeaders(req);
  headers.set("Content-Type", "application/json; charset=utf-8");
  headers.set("Cache-Control", "no-store");
  return new Response(JSON.stringify(feed, null, 2), { headers });
}
