import { NextResponse } from "next/server";
import type { ZodType } from "zod";
import type { Session } from "./permissions";
import { getSession } from "./session";

export function ok(data: unknown, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

export function fail(message: string, status = 400) {
  return NextResponse.json(
    { error: message },
    { status, headers: { "Cache-Control": "no-store" } },
  );
}

export async function readJson(req: Request): Promise<unknown> {
  try {
    return await req.json();
  } catch {
    return null;
  }
}

export function parseBody<T>(schema: ZodType<T>, body: unknown): { data: T } | { error: NextResponse } {
  const result = schema.safeParse(body);
  if (!result.success) {
    return { error: fail(result.error.issues[0]?.message ?? "Check the form and try again.") };
  }
  return { data: result.data };
}

export function parseMerge<T>(
  schema: ZodType<T>,
  existing: object,
  body: unknown,
): { data: T } | { error: NextResponse } {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { error: fail("Invalid input.") };
  }
  if (Object.keys(body).length === 0) {
    return { error: fail("Nothing to update.") };
  }
  return parseBody(schema, { ...existing, ...body });
}

export async function requireWrite(): Promise<{ session: Session } | { error: NextResponse }> {
  const session = await getSession();
  if (!session.canWrite) {
    return { error: fail("Your desk role can review content but cannot change it.", 403) };
  }
  return { session };
}

export async function requireExport(): Promise<{ session: Session } | { error: NextResponse }> {
  const session = await getSession();
  if (!session.canExport) {
    return { error: fail("Only an administrator can export a content backup.", 403) };
  }
  return { session };
}

export function parseId(raw: string): number | null {
  if (!/^\d+$/.test(raw)) return null;
  const id = Number(raw);
  return id > 0 ? id : null;
}
