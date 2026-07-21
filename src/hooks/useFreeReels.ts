
"use client";

import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import { fetchJson } from "@/lib/fetcher";

// Interfaces based on FreeReels JSON response
export interface FreeReelsItem {
  key: string;
  cover: string;
  title: string;
  desc: string;
  episode_count: number;
  follow_count: number;
  content_tags?: string[];
  container?: {
    kind: string;
    episode_info?: {
      id: string;
      name: string;
    };
    next_episode?: {
      id: string;
      name: string;
    };
  };
  link?: string;
  [key: string]: any;
}

export interface FreeReelsForYouResponse {
  code: number;
  msg: string;
  hasMore: boolean;
  items: FreeReelsItem[];
  total: number;
}

// ... types
export interface FreeReelsModule {
  type: string;
  module_name?: string;
  items: FreeReelsItem[];
  // For 'recommend' type which has nested card
  [key: string]: any;
}

export interface FreeReelsPageResponse {
  code: number;
  message: string;
  data: {
    items: FreeReelsModule[];
  };
}

export interface FreeReelsHomeResponse {
  code: number;
  message: string;
  data: {
    items: FreeReelsItem[];
  };
}

export interface FreeReelsDetailResponse {
  data: FreeReelsItem;
}

export function useFreeReelsForYou() {
  return useQuery<FreeReelsForYouResponse>({
    queryKey: ["freereels", "foryou"],
    queryFn: () => fetchJson<FreeReelsForYouResponse>("/api/freereels/foryou"),
    staleTime: 5 * 60 * 1000,
  });
}

export function useInfiniteFreeReelsDramas() {
  return useInfiniteQuery<FreeReelsForYouResponse>({
    queryKey: ["freereels", "foryou", "infinite"],
    queryFn: ({ pageParam = 1 }) => fetchJson<FreeReelsForYouResponse>(`/api/freereels/foryou?page=${pageParam}`),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
        if (lastPage.hasMore && allPages.length < 20) {
             return allPages.length + 1;
        }
        return undefined;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useFreeReelsHome() {
  return useQuery<FreeReelsPageResponse>({
    queryKey: ["freereels", "home"],
    queryFn: () => fetchJson<FreeReelsPageResponse>("/api/freereels/home"),
    staleTime: 5 * 60 * 1000,
  });
}

export function useFreeReelsAnime() {
  return useQuery<FreeReelsPageResponse>({
    queryKey: ["freereels", "anime"],
    queryFn: () => fetchJson<FreeReelsPageResponse>("/api/freereels/anime"),
    staleTime: 5 * 60 * 1000,
  });
}

// Search Response Interface
export interface FreeReelsSearchItem {
  id: string;
  name: string;
  cover: string;
  desc?: string;
  episode_count?: number;
  [key: string]: any;
}

export interface FreeReelsSearchResponse {
  code: number;
  message: string;
  data: {
    items: FreeReelsSearchItem[];
  };
}

export function useFreeReelsDetail(bookId: string) {
  return useQuery({
    queryKey: ["freereels", "detail", bookId],
    queryFn: () => fetchJson<any>(`/api/freereels/detail?id=${bookId}`),
select: (response: any) => {
        // New API format: { data: { id, title, cover, synopsis, episodes: [...] } }
        const d = response.data;
        if (!d) return null;

        // Old format: { data: { info: { ... } } }
        if (d.info) {
          const info = d.info;
          const episodes = info.episode_list?.map((ep: any) => {
            const indoSub = ep.subtitle_list?.find((sub: any) => sub.language === 'id-ID');
            return {
              id: ep.id,
              name: ep.name,
              index: info.episode_list?.indexOf(ep) || 0,
              videoUrl: ep.video_url || ep.external_audio_h264_m3u8 || "",
              cover: ep.cover || info.cover,
              subtitleUrl: indoSub?.subtitle || "",
            };
          }) || [];
          return {
            data: {
              key: info.id,
              title: info.name,
              cover: info.cover,
              follow_count: info.follow_count || 0,
              episodes,
            },
          } as any;
        }

        // New flat format
        const episodes = d.episodes?.map((ep: any) => ({
          id: ep.number || ep.episodeNumber,
          name: ep.title || ep.episodeTitle,
          index: ep.number || 0,
          videoUrl: ep.videoUrl || "",
          cover: d.cover || d.posterImg,
          subtitleUrl: "",
        })) || [];

        return {
          data: {
            key: d.id || d.dramaId,
            title: d.title,
            cover: d.cover || d.posterImg || "",
            synopsis: d.synopsis || d.description || "",
            totalEpisodes: d.totalEpisodes || episodes.length,
            episodes,
          } as any,
        };
      },
    enabled: !!bookId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useFreeReelsSearch(query: string) {
  return useQuery({
    queryKey: ["freereels", "search", query],
    queryFn: () => fetchJson<FreeReelsSearchResponse>(`/api/freereels/search?query=${encodeURIComponent(query)}`),
    select: (response) => {
        // Transform search items to FreeReelsItem format
        return response.data?.items?.map(item => ({
            ...item,
            key: item.id,
            title: item.name,
            follow_count: item.follow_count || 0,
        })) as FreeReelsItem[] || [];
    },
    enabled: !!query,
    staleTime: 60 * 1000,
  });
}
