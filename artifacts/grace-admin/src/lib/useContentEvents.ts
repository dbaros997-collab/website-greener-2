import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  getListAdmissionStepsQueryKey,
  getListGalleryImagesQueryKey,
  getListNewsItemsQueryKey,
  getListProgrammesQueryKey,
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
  resources: getListResourcesQueryKey(),
  submissions: getListSubmissionsQueryKey(),
};

/** Keep dashboard data in sync with the public site via SSE. */
export function useContentEvents(): void {
  const queryClient = useQueryClient();

  useEffect(() => {
    const source = new EventSource("/api/events");

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

      const queryKey = RESOURCE_QUERY_KEYS[resource];
      if (queryKey) {
        void queryClient.invalidateQueries({ queryKey });
      } else {
        void queryClient.invalidateQueries();
      }
    };

    source.addEventListener("content-changed", onChange);
    return () => {
      source.removeEventListener("content-changed", onChange);
      source.close();
    };
  }, [queryClient]);
}
