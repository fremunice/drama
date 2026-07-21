export interface PineDramaItem {
  id: string;
  collectionId?: string;
  title?: string;
  coverUrl?: string;
  cover?: string;
  posterUrl?: string;
  thumbnailUrl?: string;
  description?: string;
  status?: string;
  genres?: string[];
  rating?: number;
  views?: number;
  viewCount?: number;
  episodeCount?: number;
  episodes?: PineDramaEpisode[];
}

export interface PineDramaEpisode {
  id: string;
  number: number;
  title?: string;
  videoUrl?: string;
  thumbnailUrl?: string;
}

export interface PineDramaResponse {
  items?: PineDramaItem[];
  rows?: PineDramaItem[];
  data?: PineDramaItem[];
  hasMore?: boolean;
  page?: number;
  cursor?: string;
}
