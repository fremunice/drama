"use client";

import { useEffect, useRef } from "react";
import { UnifiedMediaCard } from "./UnifiedMediaCard";
import { UnifiedMediaCardSkeleton } from "./UnifiedMediaCardSkeleton";
import { UnifiedErrorDisplay } from "./UnifiedErrorDisplay";
import { useInfinitePineDramaForYou, formatViews } from "@/hooks/usePineDrama";
import { Loader2 } from "lucide-react";
import type { PineDramaItem } from "@/types/pinedrama";

interface InfinitePineDramaSectionProps {
  title?: string;
}

export function InfinitePineDramaSection({ title = "Lainnya" }: InfinitePineDramaSectionProps) {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    status,
    error,
    refetch,
  } = useInfinitePineDramaForYou();

  const loadMoreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = loadMoreRef.current;
    if (!el || !hasNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { rootMargin: "200px" }
    );

    observer.observe(el);

    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (status === "pending") {
    return (
      <section className="space-y-4">
        <div className="h-7 md:h-8 w-48 bg-white/10 rounded-lg animate-pulse mb-4" />
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3 md:gap-4">
          {Array.from({ length: 16 }).map((_, i) => (
            <UnifiedMediaCardSkeleton key={i} />
          ))}
        </div>
      </section>
    );
  }

  if (status === "error") {
    return (
      <section>
        <h2 className="font-display font-bold text-xl md:text-2xl text-foreground mb-4">
          {title}
        </h2>
        <UnifiedErrorDisplay
          title={`Gagal Memuat ${title}`}
          message={error?.message || "Terjadi kesalahan"}
          onRetry={() => refetch()}
        />
      </section>
    );
  }

  // Flatten all pages' items into a single array
  const allItems: PineDramaItem[] = data?.pages.flatMap((page) =>
    page?.items || []
  ) || [];

  // Deduplicate by id
  const seen = new Set<string>();
  const dramas = allItems.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });

  if (dramas.length === 0) {
    return null;
  }

  return (
    <section>
      <h2 className="font-display font-bold text-xl md:text-2xl text-foreground mb-4">
        {title}
      </h2>

      {dramas.length > 0 ? (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3 md:gap-4">
          {dramas.map((drama, index) => (
            <UnifiedMediaCard
              key={`${drama.id}-${index}`}
              index={index}
              title={drama.title || ""}
              cover={drama.cover || drama.coverUrl || ""}
              link={`/detail/pinedrama/${drama.id}`}
              episodes={drama.episodeCount || drama.episodes?.length}
              topLeftBadge={{ text: "PineDrama", color: "#de0202" }}
              topRightBadge={drama.views ? {
                text: formatViews(drama.views),
                isTransparent: true,
              } : null}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground text-sm">
          Data sedang dimuat...
        </div>
      )}

      {/* Loading trigger for infinite scroll */}
      <div ref={loadMoreRef} className="py-8 flex justify-center w-full">
        {isFetchingNextPage ? (
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 md:w-10 md:h-10 animate-spin text-primary" />
            <p className="text-sm md:text-base text-muted-foreground font-medium animate-pulse">Memuat lebih banyak...</p>
          </div>
        ) : hasNextPage ? (
          <div className="h-4" /> // Invisible trigger
        ) : (
          <div className="mt-8 pt-8 text-center border-t border-white/5 pb-8">
            <p className="text-sm md:text-base text-muted-foreground font-medium">Semua data telah dimuat</p>
          </div>
        )}
      </div>
    </section>
  );
}
