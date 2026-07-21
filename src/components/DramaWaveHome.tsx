"use client";

import { DramaWaveSection } from "./DramaWaveSection";
import { InfiniteDramaWaveSection } from "./InfiniteDramaWaveSection";
import { useDramaWaveTrending, useDramaWaveLatest } from "@/hooks/useDramaWave";
import { extractItems } from "@/lib/extract-items";

export function DramaWaveHome() {
  const { 
    data: trendingData, 
    isLoading: loadingTrending, 
    error: errorTrending, 
    refetch: refetchTrending 
  } = useDramaWaveTrending();

  const { 
    data: latestData, 
    isLoading: loadingLatest, 
    error: errorLatest, 
    refetch: refetchLatest 
  } = useDramaWaveLatest();

  const trendingItems = extractItems(trendingData);
  const latestItems = extractItems(latestData);

  return (
    <div className="space-y-8 animate-fade-up">
      <DramaWaveSection
        title="Trending"
        dramas={trendingItems}
        isLoading={loadingTrending}
        error={!!errorTrending}
        onRetry={() => refetchTrending()}
      />
      <DramaWaveSection
        title="Terbaru"
        dramas={latestItems}
        isLoading={loadingLatest}
        error={!!errorLatest}
        onRetry={() => refetchLatest()}
      />
      <InfiniteDramaWaveSection title="Lainnya" />
    </div>
  );
}
