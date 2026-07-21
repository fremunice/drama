"use client";

import { IDramaSection } from "./IDramaSection";
import { InfiniteIDramaSection } from "./InfiniteIDramaSection";
import { useIdramaTrending, useIdramaLatest } from "@/hooks/useiDrama";

export function IDramaHome() {
  const { 
    data: trendingData, 
    isLoading: loadingTrending, 
    error: errorTrending, 
    refetch: refetchTrending 
  } = useIdramaTrending();

  const { 
    data: latestData, 
    isLoading: loadingLatest, 
    error: errorLatest, 
    refetch: refetchLatest 
  } = useIdramaLatest();

  return (
    <div className="space-y-8 animate-fade-up">
      <IDramaSection
        title="Trending"
        dramas={trendingData}
        isLoading={loadingTrending}
        error={!!errorTrending}
        onRetry={() => refetchTrending()}
      />
      <IDramaSection
        title="Terbaru"
        dramas={latestData}
        isLoading={loadingLatest}
        error={!!errorLatest}
        onRetry={() => refetchLatest()}
      />
      <InfiniteIDramaSection title="Lainnya" />
    </div>
  );
}
