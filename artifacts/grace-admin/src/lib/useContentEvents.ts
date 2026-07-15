import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  getListAdmissionStepsQueryKey,
  getListGalleryImagesQueryKey,
  getListNewsItemsQueryKey,
  getListProgrammesQueryKey,
  getListResourceCategoriesQueryKey,
  getListResourcesQueryKey,
  getListSchoolValuesQueryKey,
  getListSiteTextQueryKey,
  getListStatsQueryKey,
  getListSubmissionsQueryKey,
  getListTestimonialsQueryKey,
  getListVideosQueryKey,
} from "@workspace/api-client-react";

const adminParams = { includeHidden: true } as const;

const RESOURCE_QUERY_KEYS: Record<string, readonly unknown[]> = {
  news: getListNewsItemsQueryKey(adminParams),
  "gallery-images": getListGalleryImagesQueryKey(adminParams),
  testimonials: getListTestimonialsQueryKey(adminParams),
  videos: getListVideosQueryKey(adminParams),
  programmes: getListProgrammesQueryKey(adminParams),
  stats: getListStatsQueryKey(adminParams),
  values: getListSchoolValuesQueryKey(adminParams),
  "admission-steps": getListAdmissionStepsQueryKey(adminParams),
  "site-text": getListSiteTextQueryKey(),
  "resource-categories": getListResourceCategoriesQueryKey(),
  resources: getListResourcesQueryKey(adminParams),
  submissions: getListSubmissionsQueryKey(),
};

function invalidateForResource(
  queryClient: ReturnType<typeof useQueryClient>,
  resource: string,
): void {
  const queryKey = RESOURCE_QUERY_KEYS[resource];
  if (queryKey) {
    void queryClient.invalidateQueries({ queryKey });
  } else {
    void queryClient.invalidateQueries();
  }
}

/** Keep dashboard data in sync with the public site via SSE (with reconnect). */
export function useContentEvents(): void {
  const queryClient = useQueryClient();

  useEffect(() => {
    let source: EventSource | null = null;
    let closed = false;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let attempt = 0;

    const onChange = (event: Event) => {
      let resource = "all";
      try {
        const data = JSON.parse((event as MessageEvent<string>).data) as {
          resource?: string;
        };
        resource = data.resource ?? "all";
      } catch {
        // Fall back to invalidating everything.
      }
      invalidateForResource(queryClient, resource);
    };

    const connect = () => {
      if (closed) return;
      source?.close();
      source = new EventSource("/api/events");
      source.addEventListener("content-changed", onChange);
      source.onopen = () => {
        attempt = 0;
      };
      source.onerror = () => {
        source?.close();
        source = null;
        if (closed) return;
        invalidateForResource(queryClient, "all");
        const delay = Math.min(30_000, 1_000 * 2 ** attempt);
        attempt += 1;
        reconnectTimer = setTimeout(connect, delay);
      };
    };

    connect();

    return () => {
      closed = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      source?.removeEventListener("content-changed", onChange);
      source?.close();
      source = null;
    };
  }, [queryClient]);
}
