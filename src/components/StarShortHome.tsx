"use client";

import { StarShortSection } from "./StarShortSection";
import { InfiniteStarShortSection } from "./InfiniteStarShortSection";
import { useStarShortTrending, useStarShortLatest } from "@/hooks/useStarShort";
import { extractItems } from "@/lib/extract-items";

export function StarShortHome() {
  const { 
    data: trendingData, 
    isLoading: loadingTrending, 
    error: errorTrending, 
    refetch: refetchTrending 
  } = useStarShortTrending();

  const { 
    data: latestData, 
    isLoading: loadingLatest, 
    error: errorLatest, 
    refetch: refetchLatest 
  } = useStarShortLatest();

 
  const trendingItems = extractItems(trendingData);
  const latestItems = extractItems(latestData);

  return (
    <div className="space-y-8 animate-fade-up">
      <StarShortSection
        title="Trending"
        dramas={trendingItems}
        isLoading={loadingTrending}
        error={!!errorTrending}
        onRetry={() => refetchTrending()}
      />
      <StarShortSection
        title="Terbaru"
        dramas={latestItems}
        isLoading={loadingLatest}
        error={!!errorLatest}
        onRetry={() => refetchLatest()}
      />
      <InfiniteStarShortSection title="Lainnya" />
    </div>
  );
}
