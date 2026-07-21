import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import { fetchJson } from "@/lib/fetcher";
import type { DramaNovaListResponse, DramaNovaPagedResponse, DramaNovaItem, DramaNovaDetailResponse, DramaNovaVideoOuterResponse } from "@/types/dramanova";

// Fetch Drama 18+
export function useDramaNovaDrama18() {
  return useQuery({
    queryKey: ["dramanova", "drama18"],
    queryFn: async () => {
      const data = await fetchJson<any>("/api/dramanova/drama18");
      return data.items || data.rows || [];
    },
    staleTime: 5 * 60 * 1000,
  });
}

// Fetch Komik
export function useDramaNovaKomik() {
  return useQuery({
    queryKey: ["dramanova", "komik"],
    queryFn: async () => {
      const data = await fetchJson<DramaNovaPagedResponse>("/api/dramanova/komik");
      return data.items || data.rows || [];
    },
    staleTime: 5 * 60 * 1000,
  });
}

// Fetch Lainnya (Trending - page-based)
export function useInfiniteDramaNovaHome() {
  return useInfiniteQuery({
    queryKey: ["dramanova", "trending"],
    queryFn: ({ pageParam = 1 }: { pageParam: number }) =>
      fetchJson<any>(`/api/dramanova/trending?page=${pageParam}`),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      if (!lastPage.items || lastPage.items.length === 0 || allPages.length >= 20) return undefined;
      return allPages.length + 1;
    },
  });
}

// Fetch Search
export function useDramaNovaSearch(query: string) {
  return useQuery({
    queryKey: ["dramanova", "search", query],
    queryFn: () => {
      if (!query) return [];
      return fetchJson<DramaNovaPagedResponse>(`/api/dramanova/search?query=${encodeURIComponent(query)}`)
        .then(data => data.rows || []);
    },
    enabled: !!query,
    staleTime: 1000 * 60 * 2,
  });
}

// Fetch Detail
export function useDramaNovaDetail(dramaId: string) {
  return useQuery({
    queryKey: ["dramanova", "detail", dramaId],
    queryFn: async () => {
      if (!dramaId) throw new Error("ID Drama tidak diberikan");
      const responseBody = await fetchJson<DramaNovaDetailResponse>(`/api/dramanova/detail?id=${encodeURIComponent(dramaId)}`);
      return responseBody.data;
    },
    enabled: !!dramaId,
    staleTime: 1000 * 60 * 5,
  });
}

// Fetch Video
export function useDramaNovaVideo(fileId: string) {
  return useQuery({
    queryKey: ["dramanova", "video", fileId],
    queryFn: async () => {
      if (!fileId) throw new Error("File ID tidak diberikan");
      const responseBody = await fetchJson<DramaNovaVideoOuterResponse>(`/api/dramanova/getvideo?fileId=${encodeURIComponent(fileId)}`);
      return responseBody.Result;
    },
    enabled: !!fileId,
    staleTime: 1000 * 60 * 5,
  });
}
