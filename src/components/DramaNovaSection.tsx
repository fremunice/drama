"use client";

import { UnifiedMediaCard } from "./UnifiedMediaCard";
import { UnifiedMediaCardSkeleton } from "./UnifiedMediaCardSkeleton";
import { UnifiedErrorDisplay } from "./UnifiedErrorDisplay";
import type { DramaNovaItem } from "@/types/dramanova";

interface DramaNovaSectionProps {
  title: string;
  dramas?: DramaNovaItem[];
  isLoading?: boolean;
  error?: boolean;
  onRetry?: () => void;
}

export function DramaNovaSection({ title, dramas, isLoading, error, onRetry }: DramaNovaSectionProps) {
  const items = Array.isArray(dramas) ? dramas : (dramas as any)?.items || (dramas as any)?.rows || [];

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
        {items.map((drama: any, index: number) => {
          const id = drama.id || drama.dramaId || drama.bookId;
          const titleText = drama.title || drama.bookName;
          const cover = drama.posterImgUrl || drama.posterImg || drama.cover || "";
          const epCount = drama.episodes || drama.totalEpisodes || drama.chapterCount || 0;

          return (
            <UnifiedMediaCard
              key={`${id}-${index}`}
              index={index}
              title={titleText}
              cover={cover}
              link={`/detail/dramanova/${id}`}
              episodes={epCount}
              topLeftBadge={{ text: "DramaNova", color: "#de0202" }}
            />
          );
        })}
      </div>
    </section>
  );
}
