export interface CommonDramaDetail {
  id: string;
  title?: string;
  totalEpisodes?: number;
  coverUrl?: string;
  cover?: string;
  posterImg?: string;
  posterImgUrl?: string;
  posterUrl?: string;
  thumbnailUrl?: string;
  description?: string;
  synopsis?: string;
  status?: string;
  genres?: string[];
  genre?: string[];
  rating?: number;
  viewCount?: number;
  episodeCount?: number;
  episodes?: CommonEpisode[] | number;
  similarDramas?: CommonDramaDetail[];
  platform?: string;
}

export interface CommonEpisode {
  id: string;
  number: number;
  title?: string;
  videoUrl?: string;
  thumbnailUrl?: string;
}

export interface CommonDrama {
  id: string;
  title: string;
  coverUrl?: string;
  posterUrl?: string;
  thumbnailUrl?: string;
  description?: string;
  status?: string;
  genres?: string[];
  rating?: number;
  viewCount?: number;
  episodeCount?: number;
  platform?: string;
}
