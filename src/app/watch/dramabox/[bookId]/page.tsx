"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { useDramaDetail, useEpisodes } from "@/hooks/useDramaDetail";
import { ChevronLeft, ChevronRight, Loader2, Settings, List, AlertCircle } from "lucide-react";
import Hls from "hls.js";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { DramaDetailDirect, DramaDetailResponseLegacy } from "@/types/drama";

// Helper to check if response is new format
function isDirectFormat(data: any): data is any {
  return data && typeof data === 'object' && (('bookId' in data && 'coverWap' in data) || ('id' in data && 'title' in data));
}

// Helper to check if response is legacy format
function isLegacyFormat(data: any): data is any {
  return data && typeof data === 'object' && 'data' in data && data.data?.book !== undefined;
}


export default function DramaBoxWatchPage() {
  const params = useParams<{ bookId: string }>();
  const bookId = params.bookId;
  const searchParams = useSearchParams();
  const router = useRouter();
  const [currentEpisode, setCurrentEpisode] = useState(0);
  const [quality, setQuality] = useState(720);
  const [showEpisodeList, setShowEpisodeList] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const { data: detailData, isLoading: detailLoading } = useDramaDetail(bookId || "");
  const { data: episodes, isLoading: episodesLoading } = useEpisodes(bookId || "");

  // Initialize from URL params
  useEffect(() => {
    const ep = parseInt(searchParams.get("ep") || "0", 10);
    if (ep >= 0) {
      setCurrentEpisode(ep);
    }
  }, [searchParams]);

  // Update URL when episode changes (for manual navigation)
  const handleEpisodeChange = (index: number, preserveFullscreen = false) => {
    setCurrentEpisode(index);
    setShowEpisodeList(false);
    if (preserveFullscreen) {
      window.history.replaceState(null, '', `/watch/dramabox/${bookId}?ep=${index}`);
    } else {
      router.push(`/watch/dramabox/${bookId}?ep=${index}`);
    }
  };

  // All useMemo hooks must be called BEFORE any early returns
  const currentEpisodeData = useMemo(() => {
    if (!episodes) return null;
    return episodes[currentEpisode] || null;
  }, [episodes, currentEpisode]);

  const defaultCdn = useMemo(() => {
    return currentEpisodeData ? { available: true } : null;
  }, [currentEpisodeData]);

  const availableQualities = useMemo(() => {
    return [720];
  }, []);

  // Get subtitle URL from episode's subtitlesUrl field
  const subtitleUrl = useMemo(() => {
    if (!currentEpisodeData) return "";
    return currentEpisodeData.subtitlesUrl || "";
  }, [currentEpisodeData]);

  const API_BASE_ORIGIN = (process.env.NEXT_PUBLIC_PRIV_API_BASE_URL || "https://priv-api.anichin.bio/api").replace(/\/api$/, "");

  const proxiedSubtitleUrl = useMemo(() => {
    if (!subtitleUrl) return "";
    if (subtitleUrl.startsWith("http")) return subtitleUrl;
    return `${API_BASE_ORIGIN}${subtitleUrl}`;
  }, [subtitleUrl]);

  // Keep selected quality valid for the current episode
  useEffect(() => {
    if (!availableQualities.length) return;
    if (!availableQualities.includes(quality)) {
      setQuality(availableQualities[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [availableQualities.join(",")]);

  // Build the video URL: use videoUrl or hlsUrl from the episode data
  const videoUrl = useMemo(() => {
    const srcUrl = currentEpisodeData?.videoUrl || currentEpisodeData?.hlsUrl;
    if (!srcUrl) return undefined;
    const fullUrl = srcUrl.startsWith("http") ? srcUrl : `${API_BASE_ORIGIN}${srcUrl}`;
    // Proxy through our server to add CORS headers
    return `/api/proxy/video?source=dramabox&url=${encodeURIComponent(fullUrl)}`;
  }, [currentEpisodeData]);

  // HLS playback support for non-Safari browsers
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !videoUrl) return;

    const isHls = videoUrl.endsWith(".m3u8") || videoUrl.includes("/hls");
    const canPlayNative = video.canPlayType("application/vnd.apple.mpegurl");

    if (isHls && !canPlayNative && Hls.isSupported()) {
      const hls = new Hls();
      hls.loadSource(videoUrl);
      hls.attachMedia(video);
      return () => {
        hls.destroy();
      };
    } else {
      video.src = videoUrl;
    }
  }, [videoUrl]);



  const handleVideoEnded = () => {
    if (!episodes) return;
    const next = currentEpisode + 1;
    if (next <= episodes.length - 1) {
      handleEpisodeChange(next, true);
    }
  };

  // Manual Subtitle Injection & Enforcement (same as FreeReels/NetShort)
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const injectTrack = () => {
      if (!proxiedSubtitleUrl) return;

      const tracks = Array.from(video.getElementsByTagName('track'));
      const existing = tracks.find(t => t.label === 'Indonesia' && t.srclang === 'id');

      if (existing) {
        if (existing.src === proxiedSubtitleUrl) return;
        video.removeChild(existing);
      }

      const track = document.createElement('track');
      track.kind = 'subtitles';
      track.label = 'Indonesia';
      track.srclang = 'id';
      track.default = true;
      track.src = proxiedSubtitleUrl;

      track.onload = () => {
        if (track.track) track.track.mode = 'showing';
      };

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
    video.addEventListener('playing', enforce);
    video.addEventListener('seeked', enforce);

    // Polling for first 2 seconds (race condition fix)
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
      video.removeEventListener('playing', enforce);
      video.removeEventListener('seeked', enforce);
      clearInterval(poll);

      try {
        const tracks = Array.from(video.getElementsByTagName('track'));
        const current = tracks.find(t => t.src === proxiedSubtitleUrl);
        if (current) video.removeChild(current);
      } catch (e) { }
    };
  }, [proxiedSubtitleUrl]);

  // Handle both new and legacy API formats
  let book: { bookId: string; bookName: string } | null = null;

  if (detailData && isDirectFormat(detailData)) {
    const d = detailData as any;
    book = {
      bookId: d.bookId || d.id,
      bookName: d.bookName || d.title
    };
  } else if (detailData && isLegacyFormat(detailData)) {
    const d = detailData as DramaDetailResponseLegacy;
    book = { bookId: d.data.book.bookId, bookName: d.data.book.bookName };
  }

  const totalEpisodes = episodes?.length || 0;

  // Loading state
  if (detailLoading || episodesLoading) {
    return (
      <main className="fixed inset-0 bg-black flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
        <div className="text-center space-y-2">
          <h3 className="text-white font-medium text-lg">Memuat video...</h3>
          <p className="text-white/60 text-sm">Mohon tunggu sebentar, data sedang diambil.</p>
        </div>
      </main>
    );
  }

  // Error state
  if (!book || !episodes) {
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
      {/* Header - Fixed Overlay with improved visibility */}
      <div className="absolute top-0 left-0 right-0 z-40 h-16 pointer-events-none">
        {/* Gradient background for readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/90 via-black/50 to-transparent" />

        <div className="relative z-10 flex items-center justify-between h-full px-4 max-w-7xl mx-auto pointer-events-auto">
          {/* Header content unchanged... */}
          <Link
            href={`/detail/dramabox/${bookId}`}
            className="flex items-center gap-2 text-white/90 hover:text-white transition-colors p-2 -ml-2 rounded-full hover:bg-white/10"
          >
            <ChevronLeft className="w-6 h-6" />
            <span className="text-primary font-bold hidden sm:inline shadow-black drop-shadow-md">DRAMASHORT</span>
          </Link>

          <div className="text-center flex-1 px-4 min-w-0">
            <h1 className="text-white font-medium truncate text-sm sm:text-base drop-shadow-md">
              {book.bookName}
            </h1>
            <p className="text-white/80 text-xs drop-shadow-md">
              {currentEpisodeData?.chapterName || `Episode ${currentEpisode + 1}`}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Quality Selector */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="p-2 text-white/90 hover:text-white transition-colors rounded-full hover:bg-white/10">
                  <Settings className="w-6 h-6 drop-shadow-md" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="z-[100]">
                {availableQualities.map((q) => (
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

            {/* Episode List Toggle */}
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
        {/* Video Element Wrapper */}
        <div className="relative w-full h-full flex items-center justify-center">
          {currentEpisodeData && videoUrl ? (
            <video
              ref={videoRef}
              src={videoUrl}
              controls
              autoPlay
              crossOrigin="anonymous"
              onEnded={handleVideoEnded}
              className="w-full h-full object-contain max-h-[100dvh]"
            />
          ) : currentEpisodeData && !videoUrl ? (
            <div className="flex flex-col items-center justify-center text-white/60 gap-3 p-8">
              <AlertCircle className="w-12 h-12" />
              <p className="text-sm text-center">Video tidak tersedia untuk episode ini</p>
            </div>
          ) : null}
        </div>

        {/* Navigation Controls Overlay - Bottom */}
        {/* Adjusted to bottom-20 on mobile per user feedback. */}
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
              {(Array.isArray(episodes) ? episodes : []).map((episode, idx) => (
                <button
                  key={episode.chapterId || episode.id || `ep-${idx}`}
                  onClick={() => handleEpisodeChange(idx)}
                  className={`
                    aspect-square flex items-center justify-center rounded-lg text-sm font-medium transition-all
                    ${idx === currentEpisode
                      ? "bg-primary text-white shadow-lg shadow-primary/20"
                      : "bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
                    }
                  `}
                >
                  {idx + 1}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </main>
  );
}