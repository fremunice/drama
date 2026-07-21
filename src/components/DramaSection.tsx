"use client";

import { UnifiedMediaCard } from "./UnifiedMediaCard";
import { UnifiedMediaCardSkeleton } from "./UnifiedMediaCardSkeleton"; // Import skeleton
import { UnifiedErrorDisplay } from "./UnifiedErrorDisplay";
import type { Drama } from "@/types/drama";

interface DramaSectionProps {
  title: string;
  dramas?: Drama[];
  isLoading?: boolean;
  error?: boolean;    // New prop
  onRetry?: () => void; // New prop
}

export function DramaSection({ title, dramas, isLoading, error, onRetry }: DramaSectionProps) {
  if (error) {
    return (
      <section>
        <h2 className="font-display font-bold text-xl md:text-2xl text-foreground mb-4">
          {title}
        </h2>
        <UnifiedErrorDisplay
          title={`Gagal Memuat ${title}`}
          message="Tidak dapat mengambil data drama."
          onRetry={onRetry}
        />
      </section>
    );
  }

  if (isLoading) {
    return (
      <section className="space-y-4">
        {/* Title Skeleton */}
        <div className="h-7 md:h-8 w-48 bg-white/10 rounded-lg animate-pulse mb-4" />

        {/* Grid Skeleton */}
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3 md:gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
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
        {dramas?.slice(0, 16).map((drama: any, index: number) => {
          // Normalize data mapping for both old (DramaBox) and new standardized API formats
          // Some APIs use id, some bookId, some dramaId
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
              key={bookId || `drama-${index}`}
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
    </section>
  );
}

