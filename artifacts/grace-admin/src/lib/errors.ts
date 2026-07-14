import { ApiError } from "@workspace/api-client-react";

export interface FriendlyError {
  title: string;
  description: string;
}

const SESSION_MESSAGE =
  "Your session may have expired or your browser is blocking cookies. Try signing in again, or open the admin in a new browser tab.";

/** True for browser/network failures (API unreachable, offline, CORS, etc.). */
export function isNetworkError(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  if (err instanceof ApiError) return false;
  const message = err.message.toLowerCase();
  return (
    err.name === "TypeError" ||
    message.includes("failed to fetch") ||
    message.includes("networkerror") ||
    message.includes("network request failed") ||
    message.includes("load failed") ||
    message.includes("fetch failed")
  );
}

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

  if (status === 409 && err instanceof ApiError) {
    const body = err.data as { error?: string } | undefined;
    return {
      title: "Already set up",
      description: body?.error ?? "An admin account already exists. Sign in instead.",
    };
  }

  if (isNetworkError(err)) {
    return {
      title: "Still connecting",
      description: "Please wait a moment and try again.",
    };
  }

  const message = err instanceof Error ? err.message : "Something went wrong";
  return { title: "Error", description: message };
}
