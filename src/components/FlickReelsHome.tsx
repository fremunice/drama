"use client";

import { FlickReelsSection } from "./FlickReelsSection";
import { InfiniteFlickReelsSection } from "./InfiniteFlickReelsSection";
import { useFlickReelsTrending, useFlickReelsLatest } from "@/hooks/useFlickReels";

export function FlickReelsHome() {
  const { 
    data: trendingData, 
    isLoading: loadingTrending, 
    error: errorTrending, 
    refetch: refetchTrending 
  } = useFlickReelsTrending();

  const { 
    data: latestData, 
    isLoading: loadingLatest, 
    error: errorLatest, 
    refetch: refetchLatest 
  } = useFlickReelsLatest();

  return (
    <div className="space-y-8 animate-fade-up">
      <FlickReelsSection
        title="Trending"
        dramas={trendingData}
        isLoading={loadingTrending}
        error={!!errorTrending}
        onRetry={() => refetchTrending()}
      />
      <FlickReelsSection
        title="Terbaru"
        dramas={latestData}
        isLoading={loadingLatest}
        error={!!errorLatest}
        onRetry={() => refetchLatest()}
      />
      <InfiniteFlickReelsSection title="Lainnya" />
    </div>
  );
}
