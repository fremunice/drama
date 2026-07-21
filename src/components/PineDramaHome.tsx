"use client";

import { PineDramaSection } from "./PineDramaSection";
import { InfinitePineDramaSection } from "./InfinitePineDramaSection";
import { usePineDramaTrending, usePineDramaForYou } from "@/hooks/usePineDrama";

export function PineDramaHome() {
  const { 
    data: trendingData, 
    isLoading: loadingTrending, 
    error: errorTrending, 
    refetch: refetchTrending 
  } = usePineDramaTrending();

  const { 
    data: foryouData, 
    isLoading: loadingForYou, 
    error: errorForYou, 
    refetch: refetchForYou 
  } = usePineDramaForYou();

  return (
    <div className="space-y-8 animate-fade-up">
      <PineDramaSection
        title="Trending"
        dramas={trendingData}
        isLoading={loadingTrending}
        error={!!errorTrending}
        onRetry={() => refetchTrending()}
      />
      <PineDramaSection
        title="Untuk Kamu"
        dramas={foryouData}
        isLoading={loadingForYou}
        error={!!errorForYou}
        onRetry={() => refetchForYou()}
      />
      <InfinitePineDramaSection title="Lainnya" />
    </div>
  );
}
