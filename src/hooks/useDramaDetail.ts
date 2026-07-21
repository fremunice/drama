import { useQuery } from "@tanstack/react-query";
import type { DramaDetailResponse, Episode } from "@/types/drama";
import { fetchJson } from "@/lib/fetcher";

const API_BASE = "/api/dramabox";

export function useDramaDetail(bookId: string) {
  return useQuery({
    queryKey: ["drama", "detail", bookId],
    queryFn: async () => {
      const response = await fetch(`${API_BASE}/detail?id=${bookId}`);
      if (!response.ok) throw new Error("Failed to fetch");
      const json = await response.json();
      // API returns { code, data: {...}, msg } - extract the actual data
      return json.data || json;
    },
    enabled: !!bookId,
    staleTime: 1000 * 60 * 5,
  });
}

export function useEpisodes(bookId: string) {
  return useQuery({
    queryKey: ["drama", "episodes", bookId],
    queryFn: async () => {
      const response = await fetch(`${API_BASE}/allepisode/${bookId}`);
      if (!response.ok) throw new Error("Failed to fetch episodes");
      const json = await response.json();
      // API returns { code, data: { episodes: [...] }, msg } - extract the episodes array
      if (json.data?.episodes) return json.data.episodes as Episode[];
      if (Array.isArray(json.data)) return json.data as Episode[];
      if (Array.isArray(json)) return json as Episode[];
      return json.data || json;
    },
    enabled: !!bookId,
    staleTime: 1000 * 60 * 5,
  });
}
