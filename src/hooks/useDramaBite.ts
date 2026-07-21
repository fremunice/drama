import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import { fetchJson } from "@/lib/fetcher";

const API_BASE = "/api/dramabite";

export function useDramaBiteTrending() {
  return useQuery({
    queryKey: ["dramabite", "trending"],
    queryFn: async () => {
      try {
        const data = await fetchJson<any>(`${API_BASE}/trending`);
        return data?.items || [];
      } catch {
        return [];
      }
    },
    staleTime: 1000 * 60 * 5,
    retry: 1,
  });
}

export function useDramaBiteLatest() {
  return useQuery({
    queryKey: ["dramabite", "latest"],
    queryFn: async () => {
      try {
        const data = await fetchJson<any>(`${API_BASE}/latest`);
        return data?.items || [];
      } catch {
        return [];
      }
    },
    staleTime: 1000 * 60 * 5,
    retry: 1,
  });
}

export function useDramaBiteSearch(query: string) {
  const normalizedQuery = query.trim();
  
  return useQuery({
    queryKey: ["dramabite", "search", normalizedQuery],
    queryFn: async () => {
      if (!normalizedQuery) return [];
      try {
        const data = await fetchJson<any>(`${API_BASE}/search?query=${encodeURIComponent(normalizedQuery)}`);
        return data?.items || [];
      } catch {
        return [];
      }
    },
    enabled: normalizedQuery.length > 0,
    staleTime: 1000 * 60 * 2,
    retry: 1,
  });
}

export function useDramaBiteDetail(id: string) {
  return useQuery({
    queryKey: ["dramabite", "detail", id],
    queryFn: async () => {
      if (!id) return null;
      try {
        const data = await fetchJson<any>(`${API_BASE}/detail?id=${id}`);
        return data?.data || data;
      } catch {
        return null;
      }
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
    retry: 1,
  });
}

export function useInfiniteDramaBiteForYou() {
  return useInfiniteQuery({
    queryKey: ["dramabite", "foryou"],
    queryFn: async ({ pageParam = 1 }: { pageParam: number }) => {
      try {
        const data = await fetchJson<any>(`${API_BASE}/foryou?page=${pageParam}`);
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
