"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { useDramaBiteDetail } from "@/hooks/useDramaBite";
import { ChevronLeft, ChevronRight, Loader2, Settings, List, AlertCircle } from "lucide-react";
import Hls from "hls.js";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function DramaBiteWatchPage() {
  const params = useParams<{ id: string }>();
  const dramaId = params.id;
  const searchParams = useSearchParams();
  const router = useRouter();
  const [currentEpisode, setCurrentEpisode] = useState(0);
  const [quality, setQuality] = useState(720);
  const [showEpisodeList, setShowEpisodeList] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);

  const { data: detailData, isLoading: detailLoading } = useDramaBiteDetail(dramaId || "");

  // Fetch episode video URL from episode API (detail API has empty videoUrl)
  const [episodeVideoUrl, setEpisodeVideoUrl] = useState("");
  const [episodeLoading, setEpisodeLoading] = useState(false);

  useEffect(() => {
    async function fetchEpisode() {
      if (!dramaId) return;
      setEpisodeLoading(true);
      try {
        const res = await fetch(`/api/dramabite/episode?id=${dramaId}&ep=${currentEpisode + 1}`);
        const data = await res.json();
        setEpisodeVideoUrl(data.videoUrl || "");
      } catch {
        setEpisodeVideoUrl("");
      } finally {
        setEpisodeLoading(false);
      }
    }
    fetchEpisode();
  }, [dramaId, currentEpisode]);

  // Initialize from URL params
  useEffect(() => {
    const ep = parseInt(searchParams.get("ep") || "1", 10);
    if (ep >= 1) setCurrentEpisode(ep - 1);
  }, [searchParams]);

  // Update URL when episode changes
  const handleEpisodeChange = (index: number, preserveFullscreen = false) => {
    setCurrentEpisode(index);
    setShowEpisodeList(false);
    if (preserveFullscreen) {
      window.history.replaceState(null, '', `/watch/dramabite/${dramaId}?ep=${index}`);
    } else {
      router.push(`/watch/dramabite/${dramaId}?ep=${index}`);
    }
  };

  // Extract episodes from detail data
  const episodes = useMemo(() => {
    if (!detailData) return [];
    return detailData.episodes || [];
  }, [detailData]);

  const currentEpisodeData = useMemo(() => {
    if (!episodes.length) return null;
    return episodes[currentEpisode] || null;
  }, [episodes, currentEpisode]);

  // Build video URL from episode API (detail API has empty videoUrl)
  const videoUrl = useMemo(() => {
    if (!episodeVideoUrl) return "";
    const rawUrl = episodeVideoUrl.startsWith("http")
      ? episodeVideoUrl
      : `https://api.anichin.bio${episodeVideoUrl}`;
    return `/api/proxy/video?source=dramabite&url=${encodeURIComponent(rawUrl)}`;
  }, [episodeVideoUrl]);

  // HLS playback
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !videoUrl) return;

    const isHls = videoUrl.endsWith(".m3u8") || videoUrl.includes("/hls");
    const canPlayNative = video.canPlayType("application/vnd.apple.mpegurl");

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    if (isHls && !canPlayNative && Hls.isSupported()) {
      const hls = new Hls();
      hls.loadSource(videoUrl);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().catch(() => { });
      });
      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) {
          console.error("HLS fatal error:", data);
        }
      });
      hlsRef.current = hls;
    } else {
      video.src = videoUrl;
      video.play().catch(() => { });
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [videoUrl]);

  const handleVideoEnded = () => {
    if (!episodes.length) return;
    const next = currentEpisode + 1;
    if (next <= episodes.length - 1) {
      handleEpisodeChange(next, true);
    }
  };

  // Subtitle injection
  const subtitleUrl = useMemo(() => {
    if (!currentEpisodeData) return "";
    return currentEpisodeData.subtitleUrl || "";
  }, [currentEpisodeData]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !subtitleUrl) return;

    const injectTrack = () => {
      const tracks = Array.from(video.getElementsByTagName('track'));
      const existing = tracks.find(t => t.label === 'Indonesia' && t.srclang === 'id');
      if (existing) {
        if (existing.src === subtitleUrl) return;
        video.removeChild(existing);
      }

      const track = document.createElement('track');
      track.kind = 'subtitles';
      track.label = 'Indonesia';
      track.srclang = 'id';
      track.default = true;
      track.src = subtitleUrl;
      video.appendChild(track);
    };

    const enforce = () => {
      const tracks = Array.from(video.textTracks);
      const indo = tracks.find(t => t.label === 'Indonesia' || t.language === 'id');
      if (indo && indo.mode !== 'showing') {
        indo.mode = 'showing';
      }
    };

    injectTrack();
    video.addEventListener('loadeddata', enforce);
    video.addEventListener('canplay', enforce);

    let retries = 0;
    const poll = setInterval(() => {
      injectTrack();
      enforce();
      retries++;
      if (retries > 10) clearInterval(poll);
    }, 200);

    return () => {
      video.removeEventListener('loadeddata', enforce);
      video.removeEventListener('canplay', enforce);
      clearInterval(poll);
    };
  }, [subtitleUrl]);

  const dramaTitle = detailData?.title || detailData?.dramaName || "Drama";
  const totalEpisodes = episodes.length;

  // Loading state
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

  // Error state
  if (!detailData || !episodes.length) {
    return (
      <main className="fixed inset-0 bg-black flex flex-col items-center justify-center p-4">
        <AlertCircle className="w-12 h-12 text-destructive mb-4" />
        <h2 className="text-2xl font-bold text-white mb-4">Drama tidak ditemukan</h2>
        <Link href="/" className="text-primary hover:underline">
          Kembali ke beranda
        </Link>
      </main>
    );
  }

  return (
    <main className="fixed inset-0 bg-black flex flex-col">
      {/* Header Overlay */}
      <div className="absolute top-0 left-0 right-0 z-40 h-16 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-black/90 via-black/50 to-transparent" />
        <div className="relative z-10 flex items-center justify-between h-full px-4 max-w-7xl mx-auto pointer-events-auto">
          <Link
            href={`/detail/dramabite/${dramaId}`}
            className="flex items-center gap-2 text-white/90 hover:text-white transition-colors p-2 -ml-2 rounded-full hover:bg-white/10"
          >
            <ChevronLeft className="w-6 h-6" />
            <span className="text-primary font-bold hidden sm:inline shadow-black drop-shadow-md">DRAMASHORT</span>
          </Link>

          <div className="text-center flex-1 px-4 min-w-0">
            <h1 className="text-white font-medium truncate text-sm sm:text-base drop-shadow-md">
              {dramaTitle}
            </h1>
            <p className="text-white/80 text-xs drop-shadow-md">
              {currentEpisodeData?.episodeTitle || `Episode ${currentEpisode + 1}`}
            </p>
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
                  <DropdownMenuItem
                    key={q}
                    onClick={() => setQuality(q)}
                    className={quality === q ? "text-primary font-semibold" : ""}
                  >
                    {q}p
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <button
              onClick={() => setShowEpisodeList(!showEpisodeList)}
              className="p-2 text-white/90 hover:text-white transition-colors rounded-full hover:bg-white/10"
            >
              <List className="w-6 h-6 drop-shadow-md" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Video Area */}
      <div className="flex-1 w-full h-full relative bg-black flex flex-col items-center justify-center">
        <div className="relative w-full h-full flex items-center justify-center">
          {currentEpisodeData && !currentEpisodeData.locked ? (
            <video
              ref={videoRef}
              controls
              autoPlay
              crossOrigin="anonymous"
              onEnded={handleVideoEnded}
              className="w-full h-full object-contain max-h-[100dvh]"
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-white/60 gap-4">
              <AlertCircle className="w-16 h-16" />
              <p className="text-lg">
                {currentEpisodeData?.locked ? "Episode terkunci" : "Video tidak tersedia"}
              </p>
            </div>
          )}
        </div>

        {/* Navigation Controls */}
        <div className="absolute bottom-20 md:bottom-12 left-0 right-0 z-40 pointer-events-none flex justify-center pb-safe-area-bottom">
          <div className="flex items-center gap-2 md:gap-6 pointer-events-auto bg-black/60 backdrop-blur-md px-3 py-1.5 md:px-6 md:py-3 rounded-full border border-white/10 shadow-lg transition-all scale-90 md:scale-100 origin-bottom">
            <button
              onClick={() => currentEpisode > 0 && handleEpisodeChange(currentEpisode - 1)}
              disabled={currentEpisode <= 0}
              className="p-1.5 md:p-2 rounded-full text-white disabled:opacity-30 hover:bg-white/10 transition-colors"
            >
              <ChevronLeft className="w-4 h-4 md:w-6 md:h-6" />
            </button>

            <span className="text-white font-medium text-xs md:text-sm tabular-nums min-w-[60px] md:min-w-[80px] text-center">
              Ep {currentEpisode + 1} / {totalEpisodes}
            </span>

            <button
              onClick={() => currentEpisode < totalEpisodes - 1 && handleEpisodeChange(currentEpisode + 1)}
              disabled={currentEpisode >= totalEpisodes - 1}
              className="p-1.5 md:p-2 rounded-full text-white disabled:opacity-30 hover:bg-white/10 transition-colors"
            >
              <ChevronRight className="w-4 h-4 md:w-6 md:h-6" />
            </button>
          </div>
        </div>
      </div>

      {/* Episode List Sidebar */}
      {showEpisodeList && (
        <>
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
            onClick={() => setShowEpisodeList(false)}
          />
          <div className="fixed inset-y-0 right-0 w-72 bg-zinc-900 z-[70] overflow-y-auto border-l border-white/10 shadow-2xl animate-in slide-in-from-right">
            <div className="p-4 border-b border-white/10 sticky top-0 bg-zinc-900 z-10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-white">Daftar Episode</h2>
                <span className="text-xs text-white/60 bg-white/10 px-2 py-0.5 rounded-full">
                  Total {totalEpisodes}
                </span>
              </div>
              <button
                onClick={() => setShowEpisodeList(false)}
                className="p-1 text-white/70 hover:text-white"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>
            <div className="p-3 grid grid-cols-5 gap-2">
              {episodes.map((episode: any, idx: number) => (
                <button
                  key={episode.episodeNumber || idx}
                  onClick={() => handleEpisodeChange(idx)}
                  className={`
                    aspect-square flex items-center justify-center rounded-lg text-sm font-medium transition-all
                    ${idx === currentEpisode
                      ? "bg-primary text-white shadow-lg shadow-primary/20"
                      : episode.locked
                        ? "bg-white/5 text-white/30 cursor-not-allowed"
                        : "bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
                    }
                  `}
                  disabled={episode.locked}
                >
                  {episode.locked ? (
                    <span className="text-xs">🔒</span>
                  ) : (
                    idx + 1
                  )}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </main>
  );
}