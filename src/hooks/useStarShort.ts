import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import { fetchJson } from "@/lib/fetcher";

const API_BASE = "/api/starshort";

export function useStarShortTrending() {
  return useQuery({
    queryKey: ["starshort", "trending"],
    queryFn: () => fetchJson(`${API_BASE}/trending`),
    staleTime: 1000 * 60 * 5,
  });
}

export function useStarShortLatest() {
  return useQuery({
    queryKey: ["starshort", "latest"],
    queryFn: () => fetchJson(`${API_BASE}/latest`),
    staleTime: 1000 * 60 * 5,
  });
}

export function useStarShortSearch(query: string) {
  const normalizedQuery = query.trim();

  return useQuery({
    queryKey: ["starshort", "search", normalizedQuery],
    queryFn: () => {
      if (!normalizedQuery) return [];
      return fetchJson(`${API_BASE}/search?q=${encodeURIComponent(normalizedQuery)}`);
    },
    enabled: normalizedQuery.length > 0,
    staleTime: 1000 * 60 * 2,
  });
}

export function useStarShortDetail(id: string) {
  return useQuery({
    queryKey: ["starshort", "detail", id],
    queryFn: () => {
      if (!id) return null;
      return fetchJson<any>(`${API_BASE}/detail?id=${id}`).then(res => res.data || res);
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  });
}

export function useStarShortForYou() {
  return useQuery({
    queryKey: ["starshort", "foryou"],
    queryFn: () => fetchJson(`${API_BASE}/foryou`),
    staleTime: 1000 * 60 * 5,
  });
}

export function useInfiniteStarShortDramas() {
  return useInfiniteQuery({
    queryKey: ["starshort", "foryou", "infinite"],
    queryFn: ({ pageParam = 1 }) =>
      fetchJson<any>(`${API_BASE}/foryou?page=${pageParam}`),
    initialPageParam: 1,
    getNextPageParam: (lastPage: any, allPages: any[]) => {
      if (lastPage?.hasMore && allPages.length < 100) {
        return allPages.length + 1;
      }
      return undefined;
    },
    select: (data) => ({
      ...data,
      pages: data.pages.map((page) => page?.items || page?.rows || []),
    }),
    staleTime: 1000 * 60 * 5,
  });
}
