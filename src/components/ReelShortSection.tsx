"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Play, Flame } from "lucide-react";
import { useReelShortHomepage } from "@/hooks/useReelShort";
import { BannerCarousel } from "./BannerCarousel";
import { UnifiedMediaCard } from "./UnifiedMediaCard";
import { UnifiedErrorDisplay } from "./UnifiedErrorDisplay";
import { InfiniteReelShortSection } from "./InfiniteReelShortSection";
import type { ReelShortBook, ReelShortBanner } from "@/types/reelshort";

export function ReelShortSection() {
  const { data, isLoading, error, refetch } = useReelShortHomepage();

  // Group content by sections
  const sections = useMemo(() => {
    // 1. Handle New Standardized Flat Format
    if (Array.isArray(data)) {
      return { banners: [], bookGroups: [{ title: "Trending", books: data }] };
    }

    // Check if it's the newer object with items array
    if ((data as any)?.items) {
      return { banners: [], bookGroups: [{ title: "Trending", books: (data as any).items }] };
    }

    // 2. Handle Legacy Nested Format
    if (!(data as any)?.data?.lists) return { banners: [], bookGroups: [] };

    const tabs = (data as any).data.tab_list || [];
    const popularTab = tabs.find((t: any) => t.tab_name === "POPULER") || tabs[0];

    if (!popularTab) return { banners: [], bookGroups: [] };

    const tabLists = (data as any).data.lists.filter((list: any) => list.tab_id === popularTab.tab_id);

    const banners: ReelShortBanner[] = [];
    const bookGroups: { title: string; books: ReelShortBook[] }[] = [];

    tabLists.forEach((list: any, index: number) => {
      if (list.banners && list.banners.length > 0) {
        banners.push(...list.banners);
      }
      if (list.books && list.books.length > 0) {
        const sectionNames = ["Populer", "Terbaru", "Trending", "Untuk Kamu"];
        const title = sectionNames[index] || `Section ${index + 1}`;
        bookGroups.push({ title, books: list.books });
      }
    });

    return { banners, bookGroups };
  }, [data]);

  if (error) {
    return (
      <UnifiedErrorDisplay
        title="Gagal Memuat ReelShort"
        message="Terjadi kesalahan saat mengambil data dari server."
        onRetry={() => refetch()}
      />
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="aspect-[21/9] rounded-2xl bg-muted/50 animate-pulse" />
        {Array.from({ length: 3 }).map((_, i) => (
          <SectionSkeleton key={i} />
        ))}
      </div>
    );
  }

  const { banners, bookGroups } = sections;

  return (
    <div className="space-y-8">
      {/* Banner Carousel */}
      {banners.length > 0 && <BannerCarousel banners={banners} />}

      {/* Book Sections - Grid Layout */}
      {bookGroups.map((group, index) => (
        <section key={index}>
          <h2 className="font-display font-bold text-xl md:text-2xl text-foreground mb-4">
            {group.title}
          </h2>

          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3 md:gap-4">
            {group.books
              .filter((book: any) => (book.id || book.book_id || book.dramaId) && (book.cover || book.posterImg || book.book_pic))
              .slice(0, 16)
              .map((book: any, index: number) => (
                <UnifiedMediaCard
                  key={book.id || book.book_id || book.dramaId}
                  index={index}
                  title={book.title || book.book_title}
                  cover={book.cover || book.posterImg || book.book_pic}
                  link={`/detail/reelshort/${book.id || book.book_id || book.dramaId}`}
                  episodes={book.episodes || book.totalEpisodes || book.chapter_count}
                  topLeftBadge={{ text: "ReelShort", color: "#de0202" }}
                  topRightBadge={book.rank_level ? {
                    text: book.rank_level,
                    isTransparent: true
                  } : null}
                />
              ))}
          </div>
        </section>
      ))}

      {/* Infinite Scroll Section */}
      <InfiniteReelShortSection title="Lainnya" />

    </div>
  );
}

function SectionSkeleton() {
  return (
    <div>
      <div className="h-6 w-32 bg-muted/50 rounded animate-pulse mb-4" />
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3 md:gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i}>
            <div className="aspect-[2/3] rounded-lg bg-muted/50 animate-pulse" />
            <div className="mt-1.5 h-3 bg-muted/50 rounded animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}
