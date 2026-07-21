export interface ReelShortBook {
  id?: string;
  bookId?: string;
  book_id?: string;
  book_title?: string;
  title?: string;
  coverUrl?: string;
  coverWap?: string;
  cover?: string;
  book_pic?: string;
  posterUrl?: string;
  thumbnailUrl?: string;
  description?: string;
  status?: string;
  genres?: string[];
  rating?: number;
  rank_level?: string;
  viewCount?: number;
  episodeCount?: number;
  chapterCount?: number;
  chapter_count?: number;
  episodes?: ReelShortEpisode[];
}

export interface ReelShortBanner {
  id: string;
  title: string;
  imageUrl?: string;
  pic?: string;
  pic_artistic_word?: string;
  link?: string;
  play_button?: number;
  book_mark?: {
    text?: string;
    color?: string;
    text_color?: string;
  };
  jump_param: {
    book_id?: string;
    book_title?: string;
    book_theme?: string[];
  };
  description?: string;
}

export interface ReelShortTabItem {
  tab_id?: string;
  tab_name?: string;
}

export interface ReelShortList {
  tab_id?: string;
  banners?: ReelShortBanner[];
  books?: ReelShortBook[];
}

export interface ReelShortHomepageData {
  tab_list?: ReelShortTabItem[];
  lists?: ReelShortList[];
}

export interface ReelShortHomepageResponse {
  data?: ReelShortHomepageData;
}

export interface ReelShortSearchResponse {
  success?: boolean;
  data?: ReelShortBook[];
  items?: ReelShortBook[];
  rows?: ReelShortBook[];
}

export interface ReelShortEpisode {
  id: string;
  number: number;
  title?: string;
  videoUrl?: string;
  thumbnailUrl?: string;
}
