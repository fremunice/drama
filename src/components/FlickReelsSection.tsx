"use client";

import { UnifiedMediaCard } from "./UnifiedMediaCard";
import { UnifiedMediaCardSkeleton } from "./UnifiedMediaCardSkeleton";
import { UnifiedErrorDisplay } from "./UnifiedErrorDisplay";

interface FlickReelsSectionProps {
  title: string;
  dramas?: any[];
  isLoading?: boolean;
  error?: boolean;
  onRetry?: () => void;
}

export function FlickReelsSection({ title, dramas, isLoading, error, onRetry }: FlickReelsSectionProps) {
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
        <div className="h-7 md:h-8 w-48 bg-white/10 rounded-lg animate-pulse mb-4" />

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
        {dramas?.map((drama, index) => (
          <UnifiedMediaCard
            key={`${drama.id || drama.bookId || drama.dramaId || index}-${index}`}
            index={index}
            title={drama.title || drama.name || drama.bookName || "Untitled"}
            cover={drama.cover || drama.posterImg || drama.posterImgUrl || drama.thumbnail || ""}
            link={`/detail/flickreels/${drama.id || drama.bookId || drama.dramaId}`}
            episodes={drama.episodes || drama.totalEpisodes || 0}
            topLeftBadge={{ text: "FlickReels", color: "#de0202" }}
          />
        ))}
      </div>
    </section>
  );
}
