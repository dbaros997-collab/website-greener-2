import type { QueryClient } from "@tanstack/react-query";
import {
  getListAdmissionStepsQueryKey,
  getListGalleryImagesQueryKey,
  getListNewsItemsQueryKey,
  getListProgrammesQueryKey,
  getListResourcesQueryKey,
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
};

export function invalidateContentQueries(
  queryClient: QueryClient,
  resource: string,
  onResourcesChange?: () => void,
): void {
  if (resource === "resources" || resource === "all") {
    onResourcesChange?.();
  }

  const queryKey = RESOURCE_QUERY_KEYS[resource];
  if (queryKey) {
    void queryClient.invalidateQueries({ queryKey });
    return;
  }

  void queryClient.invalidateQueries();
  onResourcesChange?.();
}

export function subscribeToContentEvents(
  apiBase: string,
  queryClient: QueryClient,
  onResourcesChange?: () => void,
): () => void {
  const source = new EventSource(`${apiBase}/events`);

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

    invalidateContentQueries(queryClient, resource, onResourcesChange);
  };

  source.addEventListener("content-changed", onChange);
  return () => {
    source.removeEventListener("content-changed", onChange);
    source.close();
  };
}
