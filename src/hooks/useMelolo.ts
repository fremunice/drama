
"use client";

import { useQuery, useInfiniteQuery, keepPreviousData } from "@tanstack/react-query";
import { fetchJson } from "@/lib/fetcher";

// Interfaces based on Melolo JSON response
export interface MeloloBook {
  book_id: string;
  book_name: string;
  thumb_url: string;
  abstract?: string;
  author?: string;
  book_status?: string; // "1" ?
  category_info?: string; // JSON string
  stat_infos?: string[];
  serial_count?: number;
  [key: string]: any;
}

export interface MeloloResponse {
  algo: number;
  books?: MeloloBook[];
  items?: any[];
  has_more?: boolean;
  next_offset?: number;
}

export interface MeloloSearchResponse {
  code: number;
  data: {
    search_data: {
      books: MeloloBook[];
    }[];
  };
}

export interface MeloloVideo {
  vid: string;
  vid_index: number;
  title: string;
  cover: string;
  episode_cover: string;
  duration: number;
  digged_count: number;
  comment_count: number;
  [key: string]: any;
}

export interface MeloloDetailEpisode {
  number: number;
  title: string;
  videoUrl: string;
  locked: boolean;
}

export interface MeloloDetailResponse {
  id: string;
  title: string;
  cover: string;
  description: string;
  tags: string[];
  tagV3s: any[];
  episodes: MeloloDetailEpisode[];
}

export interface MeloloStreamResponse {
  number?: number;
  videoUrl?: string;
  locked?: boolean;
}

export function useMeloloLatest() {
  return useQuery<MeloloResponse>({
    queryKey: ["melolo", "latest"],
    queryFn: () => fetchJson<MeloloResponse>("/api/melolo/latest"),
    staleTime: 5 * 60 * 1000,
  });
}

export function useMeloloTrending() {
  return useQuery<MeloloResponse>({
    queryKey: ["melolo", "trending"],
    queryFn: () => fetchJson<MeloloResponse>("/api/melolo/trending"),
    staleTime: 5 * 60 * 1000,
  });
}

export function useMeloloSearch(query: string) {
  return useQuery<MeloloSearchResponse>({
    queryKey: ["melolo", "search", query],
    queryFn: () => fetchJson<MeloloSearchResponse>(`/api/melolo/search?q=${encodeURIComponent(query)}`),
    enabled: !!query,
  });
}

export function useMeloloDetail(bookId: string) {
  return useQuery<MeloloDetailResponse>({
    queryKey: ["melolo", "detail", bookId],
    queryFn: async () => {
      const responseBody = await fetchJson<any>(`/api/melolo/detail?id=${bookId}`);
      return (responseBody.data || responseBody) as MeloloDetailResponse;
    },
    enabled: !!bookId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useMeloloEpisode(bookId: string, episodeNumber: number) {
  return useQuery<MeloloStreamResponse>({
    queryKey: ["melolo", "episode", bookId, episodeNumber],
    queryFn: async () => {
      const responseBody = await fetchJson<any>(`/api/melolo/episode?id=${bookId}&ep=${episodeNumber}`);
      return (responseBody.data || responseBody) as MeloloStreamResponse;
    },
    enabled: !!bookId && episodeNumber > 0,
    staleTime: 5 * 60 * 1000,
    placeholderData: keepPreviousData,
  });
}

// Infinite Scroll Hook for Melolo
export function useInfiniteMeloloDramas() {
  return useInfiniteQuery<MeloloResponse>({
    queryKey: ["melolo", "foryou", "infinite"],
    queryFn: ({ pageParam = 0 }) => fetchJson<MeloloResponse>(`/api/melolo/foryou?offset=${pageParam}`),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => {
      if (lastPage.has_more && lastPage.next_offset !== undefined) {
        return lastPage.next_offset;
      }
      return undefined;
    },
    staleTime: 5 * 60 * 1000,
  });
}
