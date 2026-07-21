"use client";

import { UnifiedErrorDisplay } from "@/components/UnifiedErrorDisplay";
import { useDramaDetail } from "@/hooks/useDramaDetail";
import { Play, Calendar, ChevronLeft } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import type { DramaDetailDirect, DramaDetailResponseLegacy } from "@/types/drama";
import { optimizeBg, optimizePoster } from "@/lib/image-utils";

// Helper to check if response is new format
function isDirectFormat(data: any): data is any {
  return data && typeof data === 'object' && (
    ('bookId' in data && ('coverWap' in data || 'cover' in data)) ||
    ('id' in data && 'title' in data) ||
    ('dramaId' in data && 'title' in data)
  );
}

// Helper to check if response is legacy format
function isLegacyFormat(data: any): data is any {
  return data && typeof data === 'object' && 'data' in data && data.data?.book !== undefined;
}

// Helper to check if response is dramabox format (V1 API)
function isDramaBoxFormat(data: any): data is any {
  return data && typeof data === 'object' && 'dramaId' in data && 'episodes' in data;
}


export default function DramaBoxDetailPage() {
  const params = useParams<{ bookid: string }>();
  const bookId = params.bookid;
  const router = useRouter();
  const { data, isLoading, error } = useDramaDetail(bookId || "");

  if (isLoading) {
    return <DetailSkeleton />;
  }

  // Handle V1 API format, new format, or legacy API formats
  let book: {
    bookId: string;
    bookName: string;
    cover: string;
    chapterCount: number;
    introduction: string;
    tags?: string[];
    shelfTime?: string;
  } | null = null;

  if (data && isDramaBoxFormat(data)) {
    // V1 API format from api.anichin.bio
    const d = data;
    book = {
      bookId: d.dramaId || d.id,
      bookName: d.title,
      cover: d.cover || d.posterImg || d.coverWap,
      chapterCount: d.totalEpisodes || d.episodes?.length || 0,
      introduction: d.synopsis || d.description || d.introduction,
      tags: d.categoryNames || d.tags || d.tagNames,
      shelfTime: d.publishedAt || d.shelfTime,
    };
  } else if (data && isDirectFormat(data)) {
    // New flat format or standardized format
    const d = data as any;
    const rawChapterCount = d.chapterCount ?? d.episodes?.length ?? d.chapterList?.length ?? 0;
    const chapterCount = typeof rawChapterCount === 'number' ? rawChapterCount : 0;
    book = {
      bookId: d.bookId || d.id,
      bookName: d.bookName || d.title,
      cover: d.coverWap || d.cover,
      chapterCount: chapterCount,
      introduction: d.introduction || d.description,
      tags: d.tags || d.tagNames || d.tagV3s?.map((t: any) => t.tagName),
      shelfTime: d.shelfTime || d.publishedAt,
    };
  } else if (data && isLegacyFormat(data)) {
    // Legacy nested format
    const d = data as DramaDetailResponseLegacy;
    book = {
      bookId: d.data.book.bookId,
      bookName: d.data.book.bookName,
      cover: d.data.book.cover,
      chapterCount: typeof d.data.book.chapterCount === 'number' ? d.data.book.chapterCount : 0,
      introduction: d.data.book.introduction,
      tags: d.data.book.tags,
      shelfTime: d.data.book.shelfTime,
    };
  }

  if (error || !book) {
    return (
      <div className="min-h-screen pt-24 px-4">
        <UnifiedErrorDisplay
          title="Drama tidak ditemukan"
          message="Tidak dapat memuat detail drama. Silakan coba lagi atau kembali ke beranda."
          onRetry={() => router.push('/')}
          retryLabel="Kembali ke Beranda"
        />
      </div>
    );
  }

  return (
    <main className="min-h-screen pt-20">
      {/* Hero Section with Cover */}
      <div className="relative">
        {/* Background Blur */}
        <div className="absolute inset-0 overflow-hidden">
          {book.cover && (
            <img
              src={optimizeBg(book.cover)}
              alt=""
              className="w-full h-full object-cover opacity-20 blur-3xl scale-110"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-background/50 via-background/80 to-background" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 py-8">
          {/* Back Button */}
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
          >
            <ChevronLeft className="w-5 h-5" />
            <span>Kembali</span>
          </button>

          <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] gap-8">
            {/* Cover */}
            <div className="relative group">
              {book.cover ? (
                <img
                  src={optimizePoster(book.cover)}
                  alt={book.bookName}
                  className="w-full max-w-[300px] mx-auto rounded-2xl shadow-2xl"
                />
              ) : null}
              <div
                className="absolute top-2 left-2 z-10 px-2 py-0.5 rounded text-[10px] font-bold text-white uppercase shadow-sm"
                style={{ backgroundColor: "#de0202" }}
              >
                DRAMABOX
              </div>
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-t from-background/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-6">
                <Link
                  href={`/watch/dramabox/${book.bookId}`}
                  className="px-8 py-3 rounded-full bg-primary text-primary-foreground font-semibold flex items-center gap-2 hover:scale-105 transition-transform shadow-lg"
                >
                  <Play className="w-5 h-5 fill-current" />
                  Tonton Sekarang
                </Link>
              </div>
            </div>

            {/* Info */}
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold font-display gradient-text mb-4">
                  {book.bookName}
                </h1>

                {/* Stats */}
                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <Play className="w-4 h-4" />
                    <span>{book.chapterCount} Episode</span>
                  </div>
                  {book.shelfTime && (
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-4 h-4" />
                      <span>{book.shelfTime?.split(" ")[0]}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Tags */}
              {book.tags && book.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {book.tags.map((tag) => (
                    <span key={tag} className="tag-pill">
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Description */}
              <div className="glass rounded-xl p-4">
                <h3 className="font-semibold text-foreground mb-2">Sinopsis</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {book.introduction || "Tidak ada deskripsi."}
                </p>
              </div>

              {/* Watch Button */}
              <Link
                href={`/watch/dramabox/${book.bookId}`}
                className="inline-flex items-center gap-2 px-8 py-3 rounded-full font-semibold text-primary-foreground transition-all hover:scale-105 shadow-lg"
                style={{ background: "var(--gradient-primary)" }}
              >
                <Play className="w-5 h-5 fill-current" />
                Mulai Menonton
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

function DetailSkeleton() {
  return (
    <main className="min-h-screen pt-24 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] gap-8">
          <Skeleton className="aspect-[2/3] w-full max-w-[300px] rounded-2xl" />
          <div className="space-y-4">
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="h-6 w-1/2" />
            <div className="flex gap-2">
              <Skeleton className="h-8 w-20 rounded-full" />
              <Skeleton className="h-8 w-20 rounded-full" />
              <Skeleton className="h-8 w-20 rounded-full" />
            </div>
            <Skeleton className="h-32 w-full rounded-xl" />
            <Skeleton className="h-12 w-48 rounded-full" />
          </div>
        </div>
      </div>
    </main>
  );
}