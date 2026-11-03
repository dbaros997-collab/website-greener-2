import { cookies } from "next/headers";
import { isRole, sessionFor, type Role, type Session } from "./permissions";

export const ROLE_COOKIE = "ghs_role";

export async function getSession(): Promise<Session> {
  const jar = await cookies();
  const raw = jar.get(ROLE_COOKIE)?.value;
  const role: Role = isRole(raw) ? raw : "administrator";
  return sessionFor(role);
}
