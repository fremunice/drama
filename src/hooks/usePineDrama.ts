import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import { fetchJson } from "@/lib/fetcher";
import type { PineDramaResponse } from "@/types/pinedrama";

// Helper: format view count (e.g., 365886615 → "365.9M")
export function formatViews(views: number): string {
  if (views >= 1_000_000_000) {
    return `${(views / 1_000_000_000).toFixed(1)}B`;
  }
  if (views >= 1_000_000) {
    return `${(views / 1_000_000).toFixed(1)}M`;
  }
  if (views >= 1_000) {
    return `${(views / 1_000).toFixed(1)}K`;
  }
  return views.toString();
}

// Fetch "Trending" (both pages merged server-side)
export function usePineDramaTrending() {
  return useQuery({
    queryKey: ["pinedrama", "trending"],
    queryFn: async () => {
      const data = await fetchJson<PineDramaResponse>("/api/pinedrama/trending");
      return data.items || [];
    },
    staleTime: 5 * 60 * 1000,
  });
}

// Fetch "Untuk Kamu" (first page only)
export function usePineDramaForYou() {
  return useQuery({
    queryKey: ["pinedrama", "foryou", "first"],
    queryFn: async () => {
      const data = await fetchJson<PineDramaResponse>("/api/pinedrama/foryou");
      return data.items || [];
    },
    staleTime: 5 * 60 * 1000,
  });
}

// Fetch "Lainnya" with infinite scroll pagination
export function useInfinitePineDramaForYou() {
  return useInfiniteQuery({
    queryKey: ["pinedrama", "foryou"],
    queryFn: ({ pageParam = 1 }) =>
      fetchJson<PineDramaResponse>(`/api/pinedrama/foryou?page=${pageParam}`),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (lastPage?.hasMore && lastPage?.page) {
        return lastPage.page + 1;
      }
      return undefined;
    },
  });
}

// Fetch Search
export function usePineDramaSearch(query: string) {
  return useQuery({
    queryKey: ["pinedrama", "search", query],
    queryFn: async () => {
      if (!query) return [];
      const data = await fetchJson<any>(`/api/pinedrama/search?q=${encodeURIComponent(query)}`);
      return data?.items || [];
    },
    enabled: !!query,
    staleTime: 5 * 60 * 1000,
  });
}

// Fetch Detail
export function usePineDramaDetail(collectionId: string) {
  return useQuery({
    queryKey: ["pinedrama", "detail", collectionId],
    queryFn: async () => {
      if (!collectionId) throw new Error("Collection ID tidak diberikan");
      return await fetchJson<any>(`/api/pinedrama/detail?id=${encodeURIComponent(collectionId)}`);
    },
    enabled: !!collectionId,
    staleTime: 5 * 60 * 1000,
  });
}

// Fetch Episode (for watch page)
export function usePineDramaEpisode(collectionId: string, episodeNumber: number) {
  return useQuery({
    queryKey: ["pinedrama", "episode", collectionId, episodeNumber],
    queryFn: () => {
      if (!collectionId || !episodeNumber) throw new Error("Parameter tidak lengkap");
      return fetchJson<any>(
        `/api/pinedrama/episode?id=${encodeURIComponent(collectionId)}&ep=${episodeNumber}`
      );
    },
    enabled: !!collectionId && episodeNumber > 0,
    staleTime: 5 * 60 * 1000,
  });
}

// Fetch All Episodes
export function usePineDramaAllEpisodes(collectionId: string) {
  return useQuery({
    queryKey: ["pinedrama", "allepisode", collectionId],
    queryFn: async () => {
      if (!collectionId) throw new Error("Collection ID tidak diberikan");
      return await fetchJson<any>(`/api/pinedrama/allepisode?id=${encodeURIComponent(collectionId)}`);
    },
    enabled: !!collectionId,
    staleTime: 5 * 60 * 1000,
  });
}
