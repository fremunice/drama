"use client";

import { useEffect, useRef } from "react";
import { UnifiedMediaCard } from "./UnifiedMediaCard";
import { UnifiedMediaCardSkeleton } from "./UnifiedMediaCardSkeleton";
import { UnifiedErrorDisplay } from "./UnifiedErrorDisplay";
import { useInfiniteForYouDramas } from "@/hooks/useDramas";
import { Loader2 } from "lucide-react";

interface InfiniteDramaSectionProps {
  title: string;
}

export function InfiniteDramaSection({ title }: InfiniteDramaSectionProps) {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    refetch,
  } = useInfiniteForYouDramas();

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

    return () => {
      observer.disconnect();
    };
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Flatten pages into a single array of dramas
  const allDramas = data?.pages.flatMap((page) => page) || [];

  if (isError) {
    return (
      <section>
        <h2 className="font-display font-bold text-xl md:text-2xl text-foreground mb-4">
          {title}
        </h2>
        <UnifiedErrorDisplay
          title={`Gagal Memuat ${title}`}
          message="Tidak dapat mengambil data drama."
          onRetry={() => refetch()}
        />
      </section>
    );
  }

  if (isLoading || !data) {
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

  return (
    <section>
      <h2 className="font-display font-bold text-xl md:text-2xl text-foreground mb-4">
        {title}
      </h2>

      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3 md:gap-4">
        {allDramas.map((drama: any, index: number) => {
          // Normalize data mapping for both old (DramaBox) and new standardized API formats
          const bookId = drama.bookId || drama.id || drama.dramaId || drama.collection_id;
          const title = drama.bookName || drama.title || drama.book_name;
          const cover = drama.coverWap || drama.cover || drama.cover_url || drama.posterImg || "";
          const chapterCount = drama.chapterCount || drama.episodes || drama.total_episodes || 0;

          // Normalize badge color: If text is "Terpopuler", force RED to match ReelShort/NetShort
          const isPopular = drama.corner?.name?.toLowerCase().includes("populer") ||
            drama.cornerName?.toLowerCase().includes("populer");
          const badgeColor = isPopular ? "#de0202" : (drama.corner?.color || drama.cornerColor || "#e5a00d");

          return (
            <UnifiedMediaCard
              key={`${bookId}-${index}`}
              index={index}
              title={title || "Untitled Drama"}
              cover={cover}
              link={`/detail/dramabox/${bookId}`}
              episodes={chapterCount}
              topLeftBadge={{ text: "DramaBox", color: "#de0202" }}
              topRightBadge={drama.rankVo ? {
                text: drama.rankVo.hotCode,
                isTransparent: true
              } : null}
            />
          );
        })}
      </div>

      {/* Loading Indicator & Trigger */}
      <div ref={loadMoreRef} className="py-8 flex justify-center w-full">
        {isFetchingNextPage ? (
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        ) : hasNextPage ? (
          <div className="h-4" /> // Invisible trigger
        ) : (
          <p className="text-muted-foreground text-sm">Sudah mencapai akhir daftar</p>
        )}
      </div>
    </section>
  );
}
