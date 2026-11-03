import { LIVE_SITE } from "@/lib/constants";
import { ok } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function GET() {
  const started = Date.now();
  try {
    const response = await fetch(LIVE_SITE, {
      method: "GET",
      redirect: "follow",
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
    await response.body?.cancel().catch(() => undefined);
    return ok({
      online: response.ok,
      httpStatus: response.status,
      latencyMs: Date.now() - started,
      checkedAt: new Date().toISOString(),
      url: LIVE_SITE,
    });
  } catch {
    return ok({
      online: false,
      httpStatus: 0,
      latencyMs: Date.now() - started,
      checkedAt: new Date().toISOString(),
      url: LIVE_SITE,
    });
  }
}
