
"use client";

import { useMeloloLatest, useMeloloTrending } from "@/hooks/useMelolo";
import { UnifiedMediaCard } from "./UnifiedMediaCard";
import { UnifiedErrorDisplay } from "./UnifiedErrorDisplay";
import { InfiniteMeloloSection } from "./InfiniteMeloloSection";

function MeloloSectionSkeleton() {
  return (
    <section className="space-y-4">
      <div className="h-8 w-48 bg-muted/50 rounded animate-pulse" />
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3 md:gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i}>
            <div className="aspect-[3/4] rounded-xl bg-muted/30 animate-pulse mb-2" />
            <div className="h-4 w-3/4 bg-muted/30 rounded animate-pulse" />
          </div>
        ))}
      </div>
    </section>
  );
}

export function MeloloHome() {
  const {
    data: latestData,
    isLoading: loadingLatest,
    error: errorLatest
  } = useMeloloLatest();

  const {
    data: trendingData,
    isLoading: loadingTrending,
    error: errorTrending
  } = useMeloloTrending();

  const getItems = (data: any) => {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    return data.items || data.books || data.rows || [];
  };

  const latestItems = getItems(latestData);
  const trendingItems = getItems(trendingData);

  if (errorLatest || errorTrending) {
    return (
      <UnifiedErrorDisplay
        onRetry={() => window.location.reload()}
      />
    );
  }

  if (loadingLatest || loadingTrending) {
    return (
      <div className="space-y-8 animate-fade-in">
        <MeloloSectionSkeleton />
        <MeloloSectionSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Trending Section */}
      {trendingItems.length > 0 && (
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display font-bold text-xl md:text-2xl text-foreground">
              Sedang Hangat
            </h2>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3 md:gap-4">
            {trendingItems.map((drama: any, index: number) => {
              const id = drama.id || drama.book_id || drama.dramaId;
              const title = drama.title || drama.book_name || drama.bookName;
              const cover = drama.cover || drama.thumb_url || drama.posterImg || "";
              const epCount = drama.episodes || drama.serial_count || drama.totalEpisodes || 0;

              return (
                <UnifiedMediaCard
                  key={`${id}-${index}`}
                  title={title}
                  cover={cover}
                  link={`/detail/melolo/${id}`}
                  episodes={epCount}
                  topLeftBadge={{ text: "Melolo", color: "#de0202" }}
                  index={index}
                />
              );
            })}
          </div>
        </section>
      )}

      {/* Latest Section */}
      {latestItems.length > 0 && (
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display font-bold text-xl md:text-2xl text-foreground">
              Rilis Baru
            </h2>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3 md:gap-4">
            {latestItems.map((drama: any, index: number) => {
              const id = drama.id || drama.book_id || drama.dramaId;
              const title = drama.title || drama.book_name || drama.bookName;
              const cover = drama.cover || drama.thumb_url || drama.posterImg || "";
              const epCount = drama.episodes || drama.serial_count || drama.totalEpisodes || 0;

              return (
                <UnifiedMediaCard
                  key={`${id}-${index}`}
                  title={title}
                  cover={cover}
                  link={`/detail/melolo/${id}`}
                  episodes={epCount}
                  topLeftBadge={{ text: "Melolo", color: "#de0202" }}
                  index={index}
                />
              );
            })}
          </div>
        </section>
      )}

      {/* Infinite Scroll Section */}
      <InfiniteMeloloSection title="Lainnya" />

      {!loadingLatest && !loadingTrending && !latestItems.length && !trendingItems.length && (
        <div className="text-center py-20 text-muted-foreground">
          Tidak ada konten tersedia saat ini.
        </div>
      )}
    </div>
  );
}
