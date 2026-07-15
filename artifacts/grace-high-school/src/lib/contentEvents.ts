import type { QueryClient } from "@tanstack/react-query";
import {
  getListAdmissionStepsQueryKey,
  getListGalleryImagesQueryKey,
  getListNewsItemsQueryKey,
  getListProgrammesQueryKey,
  getListResourcesQueryKey,
  getListResourceCategoriesQueryKey,
  getListSchoolValuesQueryKey,
  getListSiteTextQueryKey,
  getListStatsQueryKey,
  getListTestimonialsQueryKey,
  getListVideosQueryKey,
} from "@workspace/api-client-react";

const RESOURCE_QUERY_KEYS: Record<string, readonly unknown[]> = {
  news: getListNewsItemsQueryKey(),
  "gallery-images": getListGalleryImagesQueryKey(),
  testimonials: getListTestimonialsQueryKey(),
  videos: getListVideosQueryKey(),
  programmes: getListProgrammesQueryKey(),
  stats: getListStatsQueryKey(),
  values: getListSchoolValuesQueryKey(),
  "admission-steps": getListAdmissionStepsQueryKey(),
  "site-text": getListSiteTextQueryKey(),
  resources: getListResourcesQueryKey(),
  "resource-categories": getListResourceCategoriesQueryKey(),
};

export function invalidateContentQueries(
  queryClient: QueryClient,
  resource: string,
): void {
  const queryKey = RESOURCE_QUERY_KEYS[resource];
  if (queryKey) {
    void queryClient.invalidateQueries({ queryKey });
    return;
  }

  void queryClient.invalidateQueries();
}

/**
 * Subscribe to admin content changes over SSE with automatic reconnect.
 * When the stream drops, we reconnect with backoff and immediately refetch
 * so the public site stays in sync without a manual refresh — including
 * visitors who opened a shared link in another tab or device.
 */
export function subscribeToContentEvents(
  apiBase: string,
  queryClient: QueryClient,
): () => void {
  let source: EventSource | null = null;
  let closed = false;
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  let attempt = 0;

  const applyChange = (event: Event) => {
    let resource = "all";
    try {
      const data = JSON.parse((event as MessageEvent<string>).data) as {
        resource?: string;
      };
      resource = data.resource ?? "all";
    } catch {
      // Fall back to invalidating everything.
    }
    invalidateContentQueries(queryClient, resource);
  };

  const connect = () => {
    if (closed) return;
    source?.close();
    source = new EventSource(`${apiBase}/events`);

    source.addEventListener("content-changed", applyChange);

    source.onopen = () => {
      attempt = 0;
    };

    source.onerror = () => {
      source?.close();
      source = null;
      if (closed) return;

      // Refetch everything so a dropped stream never leaves the page stale.
      invalidateContentQueries(queryClient, "all");

      const delay = Math.min(30_000, 1_000 * 2 ** attempt);
      attempt += 1;
      reconnectTimer = setTimeout(connect, delay);
    };
  };

  connect();

  return () => {
    closed = true;
    if (reconnectTimer) clearTimeout(reconnectTimer);
    source?.removeEventListener("content-changed", applyChange);
    source?.close();
    source = null;
  };
}
