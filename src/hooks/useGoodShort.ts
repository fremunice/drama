import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import { fetchJson } from "@/lib/fetcher";
import type { GoodShortRankListResponse, GoodShortForYouResponse, GoodShortItem } from "@/types/goodshort";

// Helper: Extract items from various response formats
function extractRankItems(data: any): any[] {
  if (data?.items) return data.items;
  if (data?.rows) return data.rows;
  if (data?.data?.records?.[0]?.items) return data.data.records[0].items;
  return [];
}

// Fetch "Terbaru" (Latest)
export function useGoodShortLatest() {
  return useQuery({
    queryKey: ["goodshort", "latest"],
    queryFn: async () => {
      try {
        const data = await fetchJson<any>("/api/goodshort/latest");
        return data?.items || [];
      } catch {
        return [];
      }
    },
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}

// Fetch "Trending"
export function useGoodShortTrending() {
  return useQuery({
    queryKey: ["goodshort", "trending"],
    queryFn: async () => {
      try {
        const data = await fetchJson<any>("/api/goodshort/trending");
        return data?.items || [];
      } catch {
        return [];
      }
    },
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}

// Fetch "Lainnya" with infinite scroll (max 20 pages)
export function useInfiniteGoodShortForYou() {
  return useInfiniteQuery({
    queryKey: ["goodshort", "foryou"],
    queryFn: async ({ pageParam = 1 }: { pageParam: number }) => {
      try {
        const data = await fetchJson<any>(`/api/goodshort/foryou?page=${pageParam}`);
        return data || { items: [] };
      } catch {
        return { items: [] };
      }
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage: any, allPages) => {
      const items = lastPage?.items || [];
      if (!lastPage?.hasMore || items.length === 0 || allPages.length >= 20) {
        return undefined;
      }
      return allPages.length + 1;
    },
    retry: 1,
  });
}

// Fetch Search
export function useGoodShortSearch(query: string) {
  return useQuery({
    queryKey: ["goodshort", "search", query],
    queryFn: async () => {
      if (!query) return [];
      try {
        const data = await fetchJson<any>(`/api/goodshort/search?query=${encodeURIComponent(query)}`);
        return data?.items || [];
      } catch {
        return [];
      }
    },
    enabled: !!query,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}

// Fetch Detail
export function useGoodShortDetail(bookId: string) {
  return useQuery({
    queryKey: ["goodshort", "detail", bookId],
    queryFn: async () => {
      if (!bookId) throw new Error("Book ID tidak diberikan");
      const data = await fetchJson<any>(`/api/goodshort/detail?id=${encodeURIComponent(bookId)}`);
      const d = data?.data || data;
      return { book: d, episodes: d?.episodes || [] };
    },
    enabled: !!bookId,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}

// Fetch Episode (for watch page)
export function useGoodShortEpisode(bookId: string, episodeNumber: number) {
  return useQuery({
    queryKey: ["goodshort", "episode", bookId, episodeNumber],
    queryFn: async () => {
      if (!bookId || !episodeNumber) throw new Error("Parameter tidak lengkap");
      const data = await fetchJson<any>(
        `/api/goodshort/episode?id=${encodeURIComponent(bookId)}&ep=${episodeNumber}`
      );
      return data;
    },
    enabled: !!bookId && episodeNumber > 0,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}

// Fetch All Episodes (for watch page)
export function useGoodShortEpisodes(bookId: string) {
  return useQuery({
    queryKey: ["goodshort", "allepisode", bookId],
    queryFn: async () => {
      if (!bookId) throw new Error("Book ID tidak diberikan");
      const data = await fetchJson<any>(`/api/goodshort/detail?id=${encodeURIComponent(bookId)}`);
      const d = data?.data || data;
      return d?.episodes || [];
    },
    enabled: !!bookId,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}

