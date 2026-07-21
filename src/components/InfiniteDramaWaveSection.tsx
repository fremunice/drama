"use client";

import { useEffect, useRef, useCallback } from "react";
import { UnifiedMediaCard } from "./UnifiedMediaCard";
import { UnifiedMediaCardSkeleton } from "./UnifiedMediaCardSkeleton";
import { useInfiniteDramaWaveForYou } from "@/hooks/useDramaWave";
import { extractItems } from "@/lib/extract-items";

export function InfiniteDramaWaveSection({ title }: { title: string }) {
  const {
    data,
    error,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useInfiniteDramaWaveForYou();

  const loadMoreRef = useRef<HTMLDivElement>(null);

  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const target = entries[0];
      if (target.isIntersecting && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    },
    [hasNextPage, isFetchingNextPage, fetchNextPage]
  );

  useEffect(() => {
    const observer = new IntersectionObserver(handleObserver, {
      threshold: 0.1,
    });
    const el = loadMoreRef.current;
    if (el) observer.observe(el);
    return () => {
      if (el) observer.unobserve(el);
    };
  }, [handleObserver]);

  const allItems = (data?.pages || []).flatMap((page) => extractItems(page));
  const seen = new Set<string>();
  const uniqueItems = allItems.filter((item: any) => {
    const id = item.id || item.dramaId || item.bookId;
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  });

  if (error) {
    return (
      <section>
        <h2 className="font-display font-bold text-xl md:text-2xl text-foreground mb-4">
          {title}
        </h2>
        <p className="text-muted-foreground">Gagal memuat data.</p>
      </section>
    );
  }

  return (
    <section>
      <h2 className="font-display font-bold text-xl md:text-2xl text-foreground mb-4">
        {title}
      </h2>

      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3 md:gap-4">
        {uniqueItems.map((drama: any, index: number) => (
          <UnifiedMediaCard
            key={drama.id || drama.dramaId || drama.bookId || index}
            index={index}
            title={drama.title || drama.name || drama.bookName || "Untitled"}
            cover={drama.cover || drama.posterImg || drama.posterImgUrl || drama.thumbnail || ""}
            link={`/detail/dramawave/${drama.id || drama.dramaId || drama.bookId}`}
            episodes={drama.episodes || drama.totalEpisodes || 0}
            topLeftBadge={{ text: "DramaWave", color: "#de0202" }}
          />
        ))}
        {(isLoading || isFetchingNextPage) &&
          Array.from({ length: 8 }).map((_, i) => (
            <UnifiedMediaCardSkeleton key={`skeleton-${i}`} />
          ))}
      </div>

      {!hasNextPage && uniqueItems.length > 0 && (
        <p className="text-center text-muted-foreground text-sm mt-6">
          Semua drama sudah ditampilkan
        </p>
      )}

      <div ref={loadMoreRef} className="h-20" />
    </section>
  );
}
