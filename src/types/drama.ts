export interface Drama {
  id?: string;
  bookId?: string;
  dramaId?: string;
  title?: string;
  bookName?: string;
  coverUrl?: string;
  coverWap?: string;
  cover?: string;
  posterImg?: string;
  posterUrl?: string;
  thumbnailUrl?: string;
  description?: string;
  status?: string;
  genres?: string[];
  tags?: string[];
  rating?: number;
  viewCount?: number;
  episodeCount?: number;
  totalEpisodes?: number;
  chapterCount?: number;
  releaseYear?: number;
  rankVo?: {
    hotCode?: string;
  };
  corner?: {
    name?: string;
    color?: string;
  };
}

export interface DramaDetailDirect {
  id?: string;
  bookId?: string;
  title?: string;
  bookName?: string;
  coverUrl?: string;
  coverWap?: string;
  cover?: string;
  posterUrl?: string;
  description?: string;
  introduction?: string;
  status?: string;
  genres?: string[];
  tags?: string[];
  tagNames?: string[];
  tagV3s?: Array<{ tagName: string }>;
  rating?: number;
  episodes?: Episode[];
  chapterCount?: number;
  chapterList?: Episode[];
  viewCount?: number;
  episodeCount?: number;
  releaseYear?: number;
  publishedAt?: string;
  shelfTime?: string;
  similarDramas?: Drama[];
}

export interface DramaBook {
  bookId: string;
  bookName: string;
  cover: string;
  chapterCount: number;
  introduction: string;
  tags?: string[];
  shelfTime?: string;
}

export interface DramaDetailResponseLegacy {
  code: number;
  msg: string;
  data: {
    book: DramaBook;
  };
}

export interface DramaDetailResponse {
  data?: DramaDetailDirect;
}

export interface Episode {
  id: string;
  chapterId?: string;
  number: number;
  chapterName?: string;
  title?: string;
  videoUrl?: string;
  hlsUrl?: string;
  subtitlesUrl?: string;
  thumbnailUrl?: string;
}

export interface SearchResult {
  id?: string;
  bookId?: string;
  title?: string;
  bookName?: string;
  coverUrl?: string;
  coverWap?: string;
  cover?: string;
  posterUrl?: string;
  thumbnailUrl?: string;
  description?: string;
}
