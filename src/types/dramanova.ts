export interface DramaNovaItem {
  id: string;
  dramaId: string;
  title: string;
  coverUrl?: string;
  posterImgUrl?: string;
  posterImg?: string;
  thumbnailUrl?: string;
  description?: string;
  status?: string;
  categories?: Array<{ id: string; name: string }>;
  genres?: string[];
  rating?: number;
  viewCount?: number;
  episodeCount?: number;
  totalEpisodes?: number;
  episodes?: DramaNovaEpisode[];
}

export interface DramaNovaEpisode {
  id: string;
  number?: number;
  episodeNumber?: number;
  title?: string;
  videoUrl?: string;
  locked?: boolean;
  qualityList?: Array<{ label?: string; url?: string }>;
  thumbnailUrl?: string;
}

export interface DramaNovaDetail {
  id: string;
  dramaId: string;
  title: string;
  coverUrl?: string;
  posterImgUrl?: string;
  posterImg?: string;
  thumbnailUrl?: string;
  synopsis?: string;
  description?: string;
  introduction?: string;
  status?: string;
  categories?: Array<{ id: string; name: string }>;
  genres?: string[];
  tags?: string[];
  rating?: number;
  viewCount?: number;
  episodeCount?: number;
  totalEpisodes?: number;
  episodes?: DramaNovaEpisode[];
  similarDramas?: DramaNovaItem[];
}

export interface DramaNovaListResponse {
  items?: DramaNovaItem[];
  rows?: DramaNovaItem[];
}

export interface DramaNovaPagedResponse {
  items?: DramaNovaItem[];
  rows?: DramaNovaItem[];
  hasMore?: boolean;
}

export interface DramaNovaDetailResponse {
  data: DramaNovaDetail;
}

export interface DramaNovaVideoResponse {
  fileId: string;
  fileUrl: string;
}

export interface DramaNovaVideoOuterResponse {
  Result: DramaNovaVideoResponse;
}
