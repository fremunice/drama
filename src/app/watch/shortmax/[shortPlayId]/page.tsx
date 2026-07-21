"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { useShortMaxDetail, useShortMaxEpisode } from "@/hooks/useShortMax";
import { ChevronLeft, ChevronRight, Loader2, AlertCircle } from "lucide-react";
import Link from "next/link";

export default function ShortMaxWatchPage() {
  const params = useParams<{ shortPlayId: string }>();
  const shortPlayId = params.shortPlayId;
  const searchParams = useSearchParams();
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [currentEpisodeNum, setCurrentEpisodeNum] = useState(1);

  const epParam = parseInt(searchParams.get("ep") || "1", 10);

  const { data: detailData, isLoading: detailLoading } = useShortMaxDetail(shortPlayId || "");
  const { data: episodeData, isLoading: episodeLoading } = useShortMaxEpisode(shortPlayId || "", currentEpisodeNum);

  useEffect(() => {
    setCurrentEpisodeNum(epParam);
  }, [epParam]);

  const handleEpisodeChange = (epNum: number) => {
    setCurrentEpisodeNum(epNum);
    router.push(`/watch/shortmax/${shortPlayId}?ep=${epNum}`);
  };

  const videoUrl = useMemo(() => {
    if (!episodeData?.episode?.videoUrl) return "";
    const v = episodeData.episode.videoUrl;
    const rawUrl = v.video_720 || v.video_480 || v.video_1080 || "";
    if (!rawUrl) return "";
    return `/api/proxy/video?source=shortmax&url=${encodeURIComponent(rawUrl)}`;
  }, [episodeData]);

  const episodeList = useMemo(() => {
    const episodes = detailData?.episodes || [];
    if (episodes.length > 0) return episodes;
    // Fallback: generate episode numbers if no episodes array
    const total = (detailData as any)?.totalEpisodes || 0;
    return Array.from({ length: total }, (_, i) => ({ number: i + 1 }));
  }, [detailData]);

  if (detailLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!detailData?.title) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <AlertCircle className="w-12 h-12 text-destructive" />
          <p className="text-muted-foreground">Drama tidak ditemukan</p>
          <Link href={`/detail/shortmax/${shortPlayId}`} className="text-primary hover:underline">
            Kembali ke detail
          </Link>
        </div>
      </div>
    );
  }

  const totalEps = episodeList.length;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 glass-strong border-b border-border/50 px-4 py-3">
        <div className="flex items-center gap-4 max-w-7xl mx-auto">
          <Link
            href={`/detail/shortmax/${shortPlayId}`}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
            <span>Kembali</span>
          </Link>
          <div className="flex-1">
            <h1 className="font-semibold text-foreground truncate">
              {detailData.title}
            </h1>
            <p className="text-sm text-muted-foreground">
              Episode {currentEpisodeNum} of {totalEps}
            </p>
          </div>
        </div>
      </header>

      {/* Video Player */}
      <div className="relative bg-black aspect-video max-w-full">
        {episodeLoading ? (
          <div className="w-full h-full flex items-center justify-center">
            <Loader2 className="w-12 h-12 animate-spin text-white" />
          </div>
        ) : videoUrl ? (
          <video
            ref={videoRef}
            src={videoUrl}
            className="w-full h-full"
            controls
            autoPlay
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-4">
            <AlertCircle className="w-12 h-12 text-white/60" />
            <p className="text-white/60">Video tidak tersedia untuk episode ini</p>
            <p className="text-white/40 text-sm">Episode mungkin terkunci atau belum tersedia</p>
          </div>
        )}
      </div>

      {/* Episode Info */}
      <div className="flex-1 p-4 max-w-7xl mx-auto w-full">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-foreground">
              {detailData.title}
            </h2>
            <p className="text-sm text-muted-foreground">
              Episode {currentEpisodeNum} of {totalEps}
            </p>
          </div>
        </div>

        {/* Episode List */}
        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2 mb-4">
          {episodeList.map((ep) => (
            <button
              key={ep.number}
              onClick={() => handleEpisodeChange(ep.number)}
              className={`p-2 rounded-lg text-sm font-medium transition-colors ${ep.number === currentEpisodeNum
                ? "bg-primary text-primary-foreground"
                : "bg-muted hover:bg-muted/80 text-muted-foreground"
                }`}
            >
              {ep.number}
            </button>
          ))}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between gap-4">
          {currentEpisodeNum > 1 ? (
            <button
              onClick={() => handleEpisodeChange(currentEpisodeNum - 1)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-muted hover:bg-muted/80 text-foreground transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Sebelumnya
            </button>
          ) : (
            <div />
          )}
          {currentEpisodeNum < totalEps ? (
            <button
              onClick={() => handleEpisodeChange(currentEpisodeNum + 1)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground transition-colors"
            >
              Selanjutnya
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <div />
          )}
        </div>
      </div>
    </div>
  );
}
