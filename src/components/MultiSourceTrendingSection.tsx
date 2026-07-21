"use client";

import { useEffect, useRef, useState } from "react";
import { UnifiedMediaCard } from "./UnifiedMediaCard";
import { UnifiedMediaCardSkeleton } from "./UnifiedMediaCardSkeleton";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface MultiSourceItem {
  id: string;
  title: string;
  cover: string;
  episodes: number;
  provider: string;
  link: string;
}

export function MultiSourceTrendingSection() {
  const [items, setItems] = useState<MultiSourceItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);

  useEffect(() => {
    async function fetchAllTrending() {
      setIsLoading(true);
      const providers = [
        { name: "ReelShort", endpoint: "/api/reelshort/trending", linkPrefix: "/detail/reelshort/" },
        { name: "ShortMax", endpoint: "/api/shortmax/trending", linkPrefix: "/detail/shortmax/" },
        { name: "StarShort", endpoint: "/api/starshort/trending", linkPrefix: "/detail/starshort/" },
        { name: "DramaBite", endpoint: "/api/dramabite/trending", linkPrefix: "/detail/dramabite/" },
        { name: "DramaBox", endpoint: "/api/dramabox/trending", linkPrefix: "/detail/dramabox/" },
        { name: "DramaNova", endpoint: "/api/dramanova/trending", linkPrefix: "/detail/dramanova/" },
        { name: "DramaWave", endpoint: "/api/dramawave/trending", linkPrefix: "/detail/dramawave/" },
        { name: "FlickReels", endpoint: "/api/flickreels/trending", linkPrefix: "/detail/flickreels/" },
        { name: "FreeReels", endpoint: "/api/freereels/trending", linkPrefix: "/detail/freereels/" },
        { name: "GoodShort", endpoint: "/api/goodshort/trending", linkPrefix: "/detail/goodshort/" },
        { name: "iDrama", endpoint: "/api/idrama/trending", linkPrefix: "/detail/idrama/" },
        { name: "Melolo", endpoint: "/api/melolo/trending", linkPrefix: "/detail/melolo/" },
        { name: "NetShort", endpoint: "/api/netshort/trending", linkPrefix: "/detail/netshort/" },
        { name: "PineDrama", endpoint: "/api/pinedrama/trending", linkPrefix: "/detail/pinedrama/" },
      ];

      const allItems: MultiSourceItem[] = [];

      const results = await Promise.allSettled(
        providers.map(async (p) => {
          try {
            const res = await fetch(p.endpoint);
            const data = await res.json();
            const items = data?.items || data?.data?.items || data?.data || [];
            return items.slice(0, 4).map((item: any) => ({
              id: item.id || item.bookId || item.dramaId || item.shortPlayId || item.collectionId,
              title: item.title || item.bookName || item.dramaName || "Untitled",
              cover: item.cover || item.posterImg || item.posterImgUrl || item.coverWap || "",
              episodes: item.episodes || item.totalEpisodes || item.chapterCount || 0,
              provider: p.name,
              link: `${p.linkPrefix}${item.id || item.bookId || item.dramaId || item.shortPlayId || item.collectionId}`,
            }));
          } catch {
            return [];
          }
        })
      );

      results.forEach((result) => {
        if (result.status === "fulfilled") {
          allItems.push(...result.value);
        }
      });

      // Shuffle to mix providers
      const shuffled = allItems.sort(() => Math.random() - 0.5);
      setItems(shuffled.slice(0, 20));
      setIsLoading(false);
    }

    fetchAllTrending();
  }, []);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = scrollRef.current.clientWidth * 0.8;
      scrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  const handleScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setShowLeftArrow(scrollLeft > 10);
      setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  if (isLoading) {
    return (
      <section className="py-4">
        <div className="flex items-center gap-3 mb-4">
          <h2 className="font-display font-bold text-xl md:text-2xl text-foreground">Sedang Trending</h2>
          <span className="px-2 py-0.5 bg-red-600/20 text-red-400 text-[10px] font-bold rounded-full">MULTI-SOURCE</span>
        </div>
        <div className="flex gap-3 overflow-hidden">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex-shrink-0 w-[140px] md:w-[160px]">
              <UnifiedMediaCardSkeleton />
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (items.length === 0) return null;

  return (
    <section className="py-4 relative group">
      <div className="flex items-center gap-3 mb-4">
        <h2 className="font-display font-bold text-xl md:text-2xl text-foreground">Sedang Trending</h2>
        <span className="px-2 py-0.5 bg-red-600/20 text-red-400 text-[10px] font-bold rounded-full">MULTI-SOURCE</span>
      </div>

      <div className="relative">
        {/* Left Arrow */}
        {showLeftArrow && (
          <button
            onClick={() => scroll("left")}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-20 w-10 h-20 bg-black/60 backdrop-blur-sm rounded-r-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80"
          >
            <ChevronLeft className="w-6 h-6 text-white" />
          </button>
        )}

        {/* Scrollable Container */}
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex gap-3 overflow-x-auto scrollbar-hide scroll-smooth pb-2"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {items.map((item, index) => (
            <div key={`${item.provider}-${item.id}-${index}`} className="flex-shrink-0 w-[140px] md:w-[160px]">
              <UnifiedMediaCard
                index={index}
                title={item.title}
                cover={item.cover}
                link={item.link}
                episodes={item.episodes}
                topLeftBadge={{ text: item.provider, color: "#de0202" }}
              />
            </div>
          ))}
        </div>

        {/* Right Arrow */}
        {showRightArrow && (
          <button
            onClick={() => scroll("right")}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-20 w-10 h-20 bg-black/60 backdrop-blur-sm rounded-l-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80"
          >
            <ChevronRight className="w-6 h-6 text-white" />
          </button>
        )}
      </div>
    </section>
  );
}
