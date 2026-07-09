import { ApiError } from "@workspace/api-client-react";

export interface FriendlyError {
  title: string;
  description: string;
}

const SESSION_MESSAGE =
  "Your session may have expired or your browser is blocking cookies. Try signing in again, or open the admin in a new browser tab.";

/**
 * Turn any thrown error into a non-technical title + description suitable for a
 * toast. Authentication failures (401/403) — which most often mean the staff
 * member's session cookie didn't reach the server (common when a browser blocks
 * third-party cookies in the admin iframe) — get a clear, actionable message
 * instead of a generic "HTTP 401" string.
 */
export function toFriendlyError(err: unknown): FriendlyError {
  const status = err instanceof ApiError ? err.status : undefined;

  if (status === 401 || status === 403) {
    return { title: "Sign-in needed", description: SESSION_MESSAGE };
  }

  const message = err instanceof Error ? err.message : "Something went wrong";
  return { title: "Error", description: message };
}
