import { ok } from "@/lib/http";
import { loadMetrics } from "@/lib/metrics";

export const dynamic = "force-dynamic";

export async function GET() {
  return ok(await loadMetrics());
}
