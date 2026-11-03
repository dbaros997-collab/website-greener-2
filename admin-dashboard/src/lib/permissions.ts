export const ROLE_ORDER = ["administrator", "editor", "viewer"] as const;
export type Role = (typeof ROLE_ORDER)[number];

export type Session = {
  role: Role;
  label: string;
  detail: string;
  canWrite: boolean;
  canExport: boolean;
};

const ROLES: Record<Role, Omit<Session, "role">> = {
  administrator: {
    label: "Administrator",
    detail: "Full desk access, including content backup",
    canWrite: true,
    canExport: true,
  },
  editor: {
    label: "Editor",
    detail: "Create, edit, publish, and archive content",
    canWrite: true,
    canExport: false,
  },
  viewer: {
    label: "Viewer",
    detail: "Read-only access to the content library",
    canWrite: false,
    canExport: false,
  },
};

export function isRole(value: unknown): value is Role {
  return typeof value === "string" && ROLE_ORDER.includes(value as Role);
}

export function sessionFor(role: Role): Session {
  return { role, ...ROLES[role] };
}
