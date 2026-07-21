"use client";

import { useEffect, useRef } from "react";
import { UnifiedMediaCard } from "./UnifiedMediaCard";
import { UnifiedMediaCardSkeleton } from "./UnifiedMediaCardSkeleton";
import { useInfiniteDramaBiteForYou } from "@/hooks/useDramaBite";
import { Loader2 } from "lucide-react";

interface InfiniteDramaBiteSectionProps {
  title: string;
}

export function InfiniteDramaBiteSection({ title }: InfiniteDramaBiteSectionProps) {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    status,
    error,
    refetch,
  } = useInfiniteDramaBiteForYou();

  const loadMoreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

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
        <div className="text-center py-8 text-muted-foreground">
          <p>Gagal memuat data. Silakan coba lagi.</p>
          <button onClick={() => refetch()} className="mt-4 px-4 py-2 bg-primary text-white rounded-lg">
            Coba Lagi
          </button>
        </div>
      </section>
    );
  }

  // Flatten all pages into a single array
  const allItems = data?.pages.flatMap((page: any) => {
    const items = page?.items || [];
    return Array.isArray(items) ? items : [];
  }) || [];

  // Deduplicate by id
  const seen = new Set<string>();
  const dramas = allItems.filter((item) => {
    const id = item?.id || item?.dramaId;
    if (!id || seen.has(id)) return false;
    seen.add(id);
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

      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3 md:gap-4">
        {dramas.map((drama, index) => {
          const id = drama.id || drama.dramaId;
          return (
            <UnifiedMediaCard
              key={`${id}-${index}`}
              index={index}
              title={drama.title}
              cover={drama.cover || drama.posterImg || ""}
              link={`/detail/dramabite/${id}`}
              episodes={drama.totalEpisodes || drama.episodes || 0}
              topLeftBadge={{ text: "DramaBite", color: "#de0202" }}
            />
          );
        })}
      </div>

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

