import { cookies } from "next/headers";
import { ok, fail, readJson } from "@/lib/http";
import { isRole, sessionFor } from "@/lib/permissions";
import { getSession, ROLE_COOKIE } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET() {
  return ok({ session: await getSession() });
}

export async function POST(req: Request) {
  const body = await readJson(req);
  const role = body && typeof body === "object" && "role" in body ? body.role : null;
  if (!isRole(role)) return fail("Choose administrator, editor, or viewer.");
  const jar = await cookies();
  jar.set(ROLE_COOKIE, role, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 90,
  });
  return ok({ session: sessionFor(role) });
}
