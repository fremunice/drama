"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Loader2, Settings, List, AlertCircle } from "lucide-react";
import Hls from "hls.js";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ReelShortEpisode {
  episodeNumber: number;
  episodeTitle: string;
  videoUrl: string;
  locked: boolean;
}

interface ReelShortDetailData {
  bookId: string;
  title: string;
  cover: string;
  totalEpisodes: number;
  episodes?: ReelShortEpisode[];
}

async function fetchReelShortDetail(bookId: string): Promise<ReelShortDetailData> {
  const response = await fetch(`/api/reelshort/detail?bookId=${bookId}`);
  if (!response.ok) throw new Error("Failed to fetch");
  const json = await response.json();
  const d = json.data || json;
  return {
    bookId: d.id || d.dramaId || bookId,
    title: d.title || "",
    cover: d.cover || d.posterImg || "",
    totalEpisodes: d.totalEpisodes || d.total_episodes || 0,
  };
}

async function fetchReelShortEpisode(bookId: string, ep: number): Promise<{ videoUrl: string; locked: boolean }> {
  const response = await fetch(`/api/reelshort/episode?id=${bookId}&ep=${ep}`);
  if (!response.ok) throw new Error("Failed to fetch");
  const json = await response.json();
  const data = json.data || json;
  return {
    videoUrl: data.videoUrl || "",
    locked: data.locked === true,
  };
}

export default function ReelShortWatchPage() {
  const params = useParams<{ bookId: string }>();
  const bookId = params.bookId;
  const searchParams = useSearchParams();
  const router = useRouter();
  const [currentEpisode, setCurrentEpisode] = useState(1);
  const [quality, setQuality] = useState(720);
  const [showEpisodeList, setShowEpisodeList] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);

  const ep = parseInt(searchParams.get("ep") || "1", 10);
  useEffect(() => { if (ep >= 1) setCurrentEpisode(ep); }, [ep]);

  const { data: detailData, isLoading: detailLoading } = useQuery({
    queryKey: ["reelshort", "detail", bookId],
    queryFn: () => fetchReelShortDetail(bookId || ""),
    enabled: !!bookId,
  });

  const { data: episodeData, isLoading: episodeLoading } = useQuery({
    queryKey: ["reelshort", "episode", bookId, currentEpisode],
    queryFn: () => fetchReelShortEpisode(bookId || "", currentEpisode),
    enabled: !!bookId && !!currentEpisode,
  });

  const handleEpisodeChange = (ep: number, preserveFullscreen = false) => {
    setCurrentEpisode(ep);
    setShowEpisodeList(false);
    if (preserveFullscreen) {
      window.history.replaceState(null, '', `/watch/reelshort/${bookId}?ep=${ep}`);
    } else {
      router.push(`/watch/reelshort/${bookId}?ep=${ep}`);
    }
  };

  const videoUrl = useMemo(() => {
    if (!episodeData?.videoUrl) return "";
    const rawUrl = episodeData.videoUrl.startsWith("http")
      ? episodeData.videoUrl
      : `https://api.anichin.bio${episodeData.videoUrl}`;
    return `/api/proxy/video?source=reelshort&url=${encodeURIComponent(rawUrl)}`;
  }, [episodeData]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !videoUrl) return;
    const isHls = videoUrl.endsWith(".m3u8") || videoUrl.includes("/hls");
    const canPlayNative = video.canPlayType("application/vnd.apple.mpegurl");
    if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null; }
    if (isHls && !canPlayNative && Hls.isSupported()) {
      const hls = new Hls();
      hls.loadSource(videoUrl);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => { video.play().catch(() => { }); });
      hls.on(Hls.Events.ERROR, (_, data) => { if (data.fatal) console.error("HLS fatal error:", data); });
      hlsRef.current = hls;
    } else {
      video.src = videoUrl;
      video.play().catch(() => { });
    }
    return () => { if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null; } };
  }, [videoUrl]);

  const handleVideoEnded = () => {
    const total = detailData?.totalEpisodes || 1;
    const next = currentEpisode + 1;
    if (next <= total) handleEpisodeChange(next, true);
  };

  const dramaTitle = detailData?.title || "Drama";
  const totalEpisodes = detailData?.totalEpisodes || 1;

  if (detailLoading || episodeLoading) {
    return (
      <main className="fixed inset-0 bg-black flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
        <div className="text-center space-y-2">
          <h3 className="text-white font-medium text-lg">Memuat video...</h3>
          <p className="text-white/60 text-sm">Mohon tunggu sebentar.</p>
        </div>
      </main>
    );
  }

  if (!detailData) {
    return (
      <main className="fixed inset-0 bg-black flex flex-col items-center justify-center p-4">
        <AlertCircle className="w-12 h-12 text-destructive mb-4" />
        <h2 className="text-2xl font-bold text-white mb-4">Drama tidak ditemukan</h2>
        <Link href="/" className="text-primary hover:underline">Kembali ke beranda</Link>
      </main>
    );
  }

  return (
    <main className="fixed inset-0 bg-black flex flex-col">
      <div className="absolute top-0 left-0 right-0 z-40 h-16 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-black/90 via-black/50 to-transparent" />
        <div className="relative z-10 flex items-center justify-between h-full px-4 max-w-7xl mx-auto pointer-events-auto">
          <Link href={`/detail/reelshort/${bookId}`} className="flex items-center gap-2 text-white/90 hover:text-white transition-colors p-2 -ml-2 rounded-full hover:bg-white/10">
            <ChevronLeft className="w-6 h-6" />
            <span className="text-primary font-bold hidden sm:inline shadow-black drop-shadow-md">DRAMASHORT</span>
          </Link>
          <div className="text-center flex-1 px-4 min-w-0">
            <h1 className="text-white font-medium truncate text-sm sm:text-base drop-shadow-md">{dramaTitle}</h1>
            <p className="text-white/80 text-xs drop-shadow-md">Episode {currentEpisode}</p>
          </div>
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="p-2 text-white/90 hover:text-white transition-colors rounded-full hover:bg-white/10">
                  <Settings className="w-6 h-6 drop-shadow-md" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="z-[100]">
                {[360, 480, 720, 1080].map((q) => (
                  <DropdownMenuItem key={q} onClick={() => setQuality(q)} className={quality === q ? "text-primary font-semibold" : ""}>{q}p</DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <button onClick={() => setShowEpisodeList(!showEpisodeList)} className="p-2 text-white/90 hover:text-white transition-colors rounded-full hover:bg-white/10">
              <List className="w-6 h-6 drop-shadow-md" />
            </button>
          </div>
        </div>
      </div>
      <div className="flex-1 w-full h-full relative bg-black flex flex-col items-center justify-center">
        <div className="relative w-full h-full flex items-center justify-center">
          {episodeData?.locked ? (
            <div className="flex flex-col items-center justify-center text-white/60 gap-4">
              <AlertCircle className="w-16 h-16" />
              <p className="text-lg">Episode terkunci</p>
            </div>
          ) : videoUrl ? (
            <video ref={videoRef} controls autoPlay crossOrigin="anonymous" onEnded={handleVideoEnded} className="w-full h-full object-contain max-h-[100dvh]" />
          ) : (
            <div className="flex flex-col items-center justify-center text-white/60 gap-4">
              <AlertCircle className="w-16 h-16" />
              <p className="text-lg">Video tidak tersedia</p>
            </div>
          )}
        </div>
        <div className="absolute bottom-20 md:bottom-12 left-0 right-0 z-40 pointer-events-none flex justify-center pb-safe-area-bottom">
          <div className="flex items-center gap-2 md:gap-6 pointer-events-auto bg-black/60 backdrop-blur-md px-3 py-1.5 md:px-6 md:py-3 rounded-full border border-white/10 shadow-lg transition-all scale-90 md:scale-100 origin-bottom">
            <button onClick={() => currentEpisode > 1 && handleEpisodeChange(currentEpisode - 1)} disabled={currentEpisode <= 1} className="p-1.5 md:p-2 rounded-full text-white disabled:opacity-30 hover:bg-white/10 transition-colors">
              <ChevronLeft className="w-4 h-4 md:w-6 md:h-6" />
            </button>
            <span className="text-white font-medium text-xs md:text-sm tabular-nums min-w-[60px] md:min-w-[80px] text-center">Ep {currentEpisode} / {totalEpisodes}</span>
            <button onClick={() => currentEpisode < totalEpisodes && handleEpisodeChange(currentEpisode + 1)} disabled={currentEpisode >= totalEpisodes} className="p-1.5 md:p-2 rounded-full text-white disabled:opacity-30 hover:bg-white/10 transition-colors">
              <ChevronRight className="w-4 h-4 md:w-6 md:h-6" />
            </button>
          </div>
        </div>
      </div>
      {showEpisodeList && (
        <>
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]" onClick={() => setShowEpisodeList(false)} />
          <div className="fixed inset-y-0 right-0 w-72 bg-zinc-900 z-[70] overflow-y-auto border-l border-white/10 shadow-2xl animate-in slide-in-from-right">
            <div className="p-4 border-b border-white/10 sticky top-0 bg-zinc-900 z-10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-white">Daftar Episode</h2>
                <span className="text-xs text-white/60 bg-white/10 px-2 py-0.5 rounded-full">Total {totalEpisodes}</span>
              </div>
              <button onClick={() => setShowEpisodeList(false)} className="p-1 text-white/70 hover:text-white"><ChevronRight className="w-6 h-6" /></button>
            </div>
            <div className="p-3 grid grid-cols-5 gap-2">
              {Array.from({ length: totalEpisodes }, (_, i) => i + 1).map((epNum) => (
                <button key={epNum} onClick={() => handleEpisodeChange(epNum)}
                  className={`aspect-square flex items-center justify-center rounded-lg text-sm font-medium transition-all ${epNum === currentEpisode ? "bg-primary text-white shadow-lg shadow-primary/20" : "bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"}`}>
                  {epNum}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </main>
  );
}