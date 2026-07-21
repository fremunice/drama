import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import { fetchJson } from "@/lib/fetcher";

const API_BASE = "/api/dramawave";

export function useDramaWaveTrending() {
  return useQuery({
    queryKey: ["dramawave", "trending"],
    queryFn: () => fetchJson(`${API_BASE}/trending`),
    staleTime: 1000 * 60 * 5,
  });
}

export function useDramaWaveLatest() {
  return useQuery({
    queryKey: ["dramawave", "latest"],
    queryFn: () => fetchJson(`${API_BASE}/foryou`),
    staleTime: 1000 * 60 * 5,
  });
}

export function useDramaWaveSearch(query: string) {
  const normalizedQuery = query.trim();
  
  return useQuery({
    queryKey: ["dramawave", "search", normalizedQuery],
    queryFn: () => {
      if (!normalizedQuery) return [];
      return fetchJson(`${API_BASE}/search?q=${encodeURIComponent(normalizedQuery)}`);
    },
    enabled: normalizedQuery.length > 0,
    staleTime: 1000 * 60 * 2,
  });
}

export function useDramaWaveDetail(id: string) {
  return useQuery({
    queryKey: ["dramawave", "detail", id],
    queryFn: () => {
      if (!id) return null;
      return fetchJson<any>(`${API_BASE}/detail?id=${id}`).then(res => res.data || res);
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  });
}

export function useInfiniteDramaWaveForYou() {
  return useInfiniteQuery({
    queryKey: ["dramawave", "foryou", "infinite"],
    queryFn: async ({ pageParam = 1 }) => {
      const res = await fetchJson<any>(`${API_BASE}/foryou?page=${pageParam}`);
      return res;
    },
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.hasMore === false) return undefined;
      return allPages.length + 1;
    },
    initialPageParam: 1,
    staleTime: 1000 * 60 * 5,
  });
}
