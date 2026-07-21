"use client";

import { useShortMaxRekomendasi } from "@/hooks/useShortMax";
import { UnifiedMediaCard } from "./UnifiedMediaCard";
import { UnifiedMediaCardSkeleton } from "./UnifiedMediaCardSkeleton";
import { UnifiedErrorDisplay } from "./UnifiedErrorDisplay";
import { InfiniteShortMaxSection } from "./InfiniteShortMaxSection";

export function ShortMaxHome() {
  const {
    data: rekomendasiData,
    isLoading: loadingRekomendasi,
    error: errorRekomendasi,
    refetch: refetchRekomendasi,
  } = useShortMaxRekomendasi();

  return (
    <div className="space-y-10 animate-fade-in pb-12">
      {/* Rekomendasi Section */}
      <section>
        {(() => {
          const rawItems = (rekomendasiData as any)?.items || (rekomendasiData as any)?.data || (Array.isArray(rekomendasiData) ? rekomendasiData : []);

          if (errorRekomendasi || (!loadingRekomendasi && rawItems.length === 0)) {
            return (
              <>
                <h2 className="font-display font-bold text-xl md:text-2xl text-foreground mb-4">
                  Rekomendasi
                </h2>
                <UnifiedErrorDisplay
                  title="Gagal Memuat Rekomendasi"
                  message="Tidak dapat mengambil data drama."
                  onRetry={() => refetchRekomendasi()}
                />
              </>
            );
          }

          if (loadingRekomendasi) {
            return (
              <>
                <div className="h-7 md:h-8 w-48 bg-white/10 rounded-lg animate-pulse mb-4" />
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3 md:gap-4">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <UnifiedMediaCardSkeleton key={i} index={i} />
                  ))}
                </div>
              </>
            );
          }

          return (
            <>
              <h2 className="font-display font-bold text-xl md:text-2xl text-foreground mb-4">
                Rekomendasi
              </h2>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3 md:gap-4">
                {rawItems.map((drama: any, index: number) => {
                  const id = drama.id || drama.shortPlayId || drama.dramaId;
                  const title = drama.title || drama.bookName;
                  const cover = drama.cover || drama.posterImg || "";
                  const epCount = drama.episodes || drama.totalEpisodes || drama.chapterCount || 0;

                  return (
                    <UnifiedMediaCard
                      key={`rekomendasi-${id}-${index}`}
                      index={index}
                      title={title}
                      cover={cover}
                      link={`/detail/shortmax/${id}`}
                      episodes={epCount}
                      topLeftBadge={{ text: "ShortMax", color: "#de0202" }}
                    />
                  );
                })}
              </div>
            </>
          );
        })()}
      </section>

      {/* Infinite Scroll Section */}
      <InfiniteShortMaxSection title="Lainnya" />
    </div>
  );
}
