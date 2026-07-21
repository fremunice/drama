export interface GoodShortItem {
  id: string;
  bookId?: string;
  book_id?: string;
  title?: string;
  bookName?: string;
  coverUrl?: string;
  cover?: string;
  coverWap?: string;
  posterUrl?: string;
  thumbnailUrl?: string;
  description?: string;
  status?: string;
  genres?: string[];
  rating?: number;
  viewCount?: number;
  episodeCount?: number;
  episodes?: GoodShortEpisode[];
}

export interface GoodShortEpisode {
  id: string;
  number?: number;
  episodeNumber?: number;
  title?: string;
  videoUrl?: string;
  thumbnailUrl?: string;
}

export interface GoodShortRankListResponse {
  items?: GoodShortItem[];
  rows?: GoodShortItem[];
}

export interface GoodShortForYouResponse {
  items?: GoodShortItem[];
  rows?: GoodShortItem[];
  hasMore?: boolean;
}
