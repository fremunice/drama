"use client";

import { DramaBiteSection } from "./DramaBiteSection";
import { InfiniteDramaBiteSection } from "./InfiniteDramaBiteSection";
import { useDramaBiteTrending, useDramaBiteLatest } from "@/hooks/useDramaBite";

export function DramaBiteHome() {
  const { 
    data: trendingData, 
    isLoading: loadingTrending, 
    error: errorTrending, 
    refetch: refetchTrending 
  } = useDramaBiteTrending();

  const { 
    data: latestData, 
    isLoading: loadingLatest, 
    error: errorLatest, 
    refetch: refetchLatest 
  } = useDramaBiteLatest();

  return (
    <div className="space-y-8 animate-fade-up">
      <DramaBiteSection
        title="Trending"
        dramas={trendingData}
        isLoading={loadingTrending}
        error={!!errorTrending}
        onRetry={() => refetchTrending()}
      />
      <DramaBiteSection
        title="Terbaru"
        dramas={latestData}
        isLoading={loadingLatest}
        error={!!errorLatest}
        onRetry={() => refetchLatest()}
      />
      <InfiniteDramaBiteSection title="Lainnya" />
    </div>
  );
}
