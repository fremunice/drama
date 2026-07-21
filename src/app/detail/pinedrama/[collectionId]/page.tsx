"use client";

import { useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { usePineDramaDetail } from "@/hooks/usePineDrama";
import { Play, ChevronLeft } from "lucide-react";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { UnifiedErrorDisplay } from "@/components/UnifiedErrorDisplay";
import { optimizeBg, optimizePoster } from "@/lib/image-utils";

export default function PineDramaDetailPage() {
  const params = useParams<{ collectionId: string }>();
  const collectionId = params.collectionId;
  const router = useRouter();

  const { data: detailData, isLoading, error } = usePineDramaDetail(collectionId || "");

  const drama = useMemo(() => {
    if (!detailData) return null;
    const d = detailData?.data || detailData;
    return {
      id: d.id || collectionId,
      title: d.title || "Untitled",
      cover: d.cover || d.coverUrl || d.thumbnailUrl || "",
      description: d.description || d.introduction || "",
      genres: d.genres || d.tags || [],
      episodeCount: d.episodeCount || d.totalEpisodes || (d.episodeList ? d.episodeList.length : d.episodes ? (Array.isArray(d.episodes) ? d.episodes.length : d.episodes) : 0),
    };
  }, [detailData, collectionId]);

  if (isLoading) {
    return <DetailSkeleton />;
  }

  if (error || !drama) {
    return (
      <div className="min-h-screen pt-24 px-4">
        <UnifiedErrorDisplay
          title="Drama tidak ditemukan"
          message="Tidak dapat memuat detail drama. Silakan coba lagi."
          onRetry={() => router.push("/")}
          retryLabel="Kembali ke Beranda"
        />
      </div>
    );
  }

  return (
    <main className="min-h-screen pt-20">
      {/* Hero Section */}
      <div className="relative">
        {/* Background Blur */}
        <div className="absolute inset-0 overflow-hidden">
          {drama.cover && (
            <>
              <img
                src={optimizeBg(drama.cover)}
                alt=""
                className="w-full h-full object-cover opacity-20 blur-3xl scale-110"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-background/50 via-background/80 to-background" />
            </>
          )}
        </div>

        <div className="relative max-w-7xl mx-auto px-4 py-8">
          <button
            onClick={() => router.push("/")}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
          >
            <ChevronLeft className="w-5 h-5" />
            <span>Kembali</span>
          </button>

          <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] gap-8">
            {/* Poster */}
            <div className="relative group">
              {drama.cover ? (
                <img
                  src={optimizePoster(drama.cover)}
                  alt={drama.title}
                  className="w-full max-w-[300px] mx-auto rounded-2xl shadow-2xl"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-full max-w-[300px] mx-auto aspect-[2/3] rounded-2xl bg-muted flex items-center justify-center">
                  <span className="text-muted-foreground">No Cover</span>
                </div>
              )}
              <div
                className="absolute top-2 left-2 z-10 px-2 py-0.5 rounded text-[10px] font-bold text-white uppercase shadow-sm"
                style={{ backgroundColor: "#E52E2E" }}
              >
                PINEDRAMA
              </div>
              {drama.episodeCount > 0 && (
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-t from-background/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-6">
                  <Link
                    href={`/watch/pinedrama/${collectionId}`}
                    className="px-8 py-3 rounded-full bg-primary text-primary-foreground font-semibold flex items-center gap-2 hover:scale-105 transition-transform shadow-lg"
                  >
                    <Play className="w-5 h-5 fill-current" />
                    Tonton Sekarang
                  </Link>
                </div>
              )}
            </div>

            {/* Info */}
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold font-display gradient-text mb-4">
                  {drama.title}
                </h1>

                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <Play className="w-4 h-4" />
                    <span>{drama.episodeCount} Episode</span>
                  </div>
                </div>

                {drama.genres && drama.genres.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-4">
                    {drama.genres.map((genre: string, idx: number) => (
                      <span key={idx} className="tag-pill text-xs">
                        {genre}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Description */}
              <div className="glass rounded-xl p-4">
                <h3 className="font-semibold text-foreground mb-2">Sinopsis</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {drama.description || "Tidak ada sinopsis."}
                </p>
              </div>

              {/* Watch Button */}
              {drama.episodeCount > 0 && (
                <Link
                  href={`/watch/pinedrama/${collectionId}`}
                  className="inline-flex items-center gap-2 px-8 py-3 rounded-full font-semibold text-primary-foreground transition-all hover:scale-105 shadow-lg"
                  style={{ background: "var(--gradient-primary)" }}
                >
                  <Play className="w-5 h-5 fill-current" />
                  Mulai Menonton
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

function DetailSkeleton() {
  return (
    <main className="min-h-screen pt-20">
      <div className="relative max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] gap-8">
          <Skeleton className="w-full max-w-[300px] mx-auto aspect-[2/3] rounded-2xl" />
          <div className="space-y-4">
            <Skeleton className="h-12 w-3/4" />
            <Skeleton className="h-6 w-1/4" />
            <Skeleton className="h-32 w-full rounded-xl" />
          </div>
        </div>
      </div>
    </main>
  );
}
