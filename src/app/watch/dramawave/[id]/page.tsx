"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Loader2, List, AlertCircle, Settings } from "lucide-react";
import Link from "next/link";
import { fetchJson } from "@/lib/fetcher";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Hls from "hls.js";

interface Quality {
  label: string;
  url: string;
  isDefault?: boolean;
}

interface Subtitle {
  label: string;
  language: string;
  url: string;
}

interface EpisodeData {
  videoUrl: string;
  qualityList: Quality[];
  subtitles: Subtitle[];
  episodeNumber: number;
}

export default function DramaWaveWatchPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [showEpisodeList, setShowEpisodeList] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [videoError, setVideoError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [episodeData, setEpisodeData] = useState<EpisodeData | null>(null);
  const [currentEpisode, setCurrentEpisode] = useState(1);
  const [totalEpisodes, setTotalEpisodes] = useState(0);
  const [episodes, setEpisodes] = useState<any[]>([]);
  const [selectedQuality, setSelectedQuality] = useState<string>("");
  const [selectedSubtitle, setSelectedSubtitle] = useState<string>("");

  const dramaId = params.id || "";

  // Fetch detail for total episodes, title, and episodes array (with locked status)
  const [dramaTitle, setDramaTitle] = useState("Loading...");

  useEffect(() => {
    async function fetchDetail() {
      try {
        const res = await fetchJson<any>(`/api/dramawave/detail?id=${dramaId}`);
        const data = res.data || res;
        setDramaTitle(data.title || "Drama");
        // Handle episodes: could be array (with locked info) or number (just count)
        if (Array.isArray(data.episodes)) {
          setEpisodes(data.episodes);
          setTotalEpisodes(data.episodes.length);
        } else {
          setTotalEpisodes(data.totalEpisodes || data.episodes || 0);
        }
      } catch {
        // ignore
      }
    }
    if (dramaId) fetchDetail();
  }, [dramaId]);

  // Check if current episode is locked (from episodes array or episode API response)
  const isCurrentEpisodeLocked = episodes.length > 0
    ? episodes[currentEpisode - 1]?.locked === true
    : episodeData && 'locked' in episodeData
      ? (episodeData as any).locked === true
      : false;

  // Fetch episode data
  useEffect(() => {
    async function fetchEpisode() {
      try {
        setIsLoading(true);
        setVideoError(false);
        const res = await fetchJson<any>(`/api/dramawave/episode?id=${dramaId}&ep=${currentEpisode}`);
        const data = res;
        setEpisodeData(data);

        // Set default quality - use master playlist (without _0 suffix) for audio support
        if (data.qualityList?.length) {
          const defaultQ = data.qualityList.find((q: Quality) => q.isDefault) || data.qualityList[0];
          // Transform per-quality URL to master playlist URL (remove _N suffix before .m3u8)
          const masterUrl = defaultQ.url.replace(/_\d+\.m3u8$/, '.m3u8');
          setSelectedQuality(masterUrl);
        } else if (data.videoUrl) {
          // Also try to use master playlist for direct videoUrl
          const masterUrl = data.videoUrl.replace(/_\d+\.m3u8$/, '.m3u8');
          setSelectedQuality(masterUrl);
        }

        // Set default subtitle (Indonesian)
        if (data.subtitles?.length) {
          const indo = data.subtitles.find((s: Subtitle) => s.language === "id-ID");
          if (indo) setSelectedSubtitle(indo.url);
        }
      } catch (err) {
        console.error("Episode fetch error:", err);
        setVideoError(true);
      } finally {
        setIsLoading(false);
      }
    }
    if (dramaId) fetchEpisode();
  }, [dramaId, currentEpisode]);

  // Handle video playback
  useEffect(() => {
    if (!selectedQuality || !videoRef.current) return;

    const video = videoRef.current;
    const isHls = selectedQuality.includes(".m3u8");

    // Destroy previous HLS instance
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    // Proxy HLS streams through shared /api/proxy/video to avoid CORS
    const streamUrl = isHls
      ? `/api/proxy/video?source=dramawave&url=${encodeURIComponent(selectedQuality)}`
      : selectedQuality;

    if (isHls && Hls.isSupported()) {
      const hls = new Hls({
        maxBufferLength: 30,
        maxMaxBufferLength: 60,
      });
      hls.loadSource(streamUrl);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().catch(() => { });
      });
      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) {
          setVideoError(true);
        }
      });
      hlsRef.current = hls;
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = streamUrl;
      video.play().catch(() => { });
    } else {
      video.src = streamUrl;
      video.play().catch(() => { });
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [selectedQuality]);

  // Subtitle injection
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !selectedSubtitle) return;

    const injectTrack = () => {
      const tracks = Array.from(video.getElementsByTagName("track"));
      const existing = tracks.find((t) => t.label === "Indonesia" && t.srclang === "id");
      if (existing) {
        if (existing.src === selectedSubtitle) return;
        video.removeChild(existing);
      }

      const track = document.createElement("track");
      track.kind = "subtitles";
      track.label = "Indonesia";
      track.srclang = "id";
      track.default = true;
      track.src = selectedSubtitle;
      video.appendChild(track);
    };

    const enforce = () => {
      const tracks = Array.from(video.textTracks);
      const indo = tracks.find((t) => t.label === "Indonesia" || t.language === "id");
      if (indo && indo.mode !== "showing") {
        indo.mode = "showing";
      }
    };

    injectTrack();
    video.addEventListener("loadeddata", enforce);
    video.addEventListener("canplay", enforce);

    return () => {
      video.removeEventListener("loadeddata", enforce);
      video.removeEventListener("canplay", enforce);
    };
  }, [selectedSubtitle]);

  const handleEpisodeChange = useCallback(
    (ep: number) => {
      if (ep < 1) return;
      if (totalEpisodes > 0 && ep > totalEpisodes) return;
      setCurrentEpisode(ep);
      setShowEpisodeList(false);
    },
    [totalEpisodes]
  );

  // Track when video started playing to prevent premature advancement
  const videoStartTimeRef = useRef<number>(0);

  const handleVideoEnded = useCallback(() => {
    // Guard: prevent advancing if video played for less than 3 seconds (avoids premature ended events)
    if (Date.now() - videoStartTimeRef.current < 3000) return;
    // Don't auto-advance if next episode is locked
    const nextEp = currentEpisode + 1;
    const nextLocked = episodes.length > 0 && episodes[nextEp - 1]?.locked === true;
    if (currentEpisode < totalEpisodes && !nextLocked) {
      handleEpisodeChange(nextEp);
    }
  }, [currentEpisode, totalEpisodes, episodes, handleEpisodeChange]);

  const handleTimeUpdate = useCallback(() => {
    // Record first play time
    if (videoStartTimeRef.current === 0) {
      videoStartTimeRef.current = Date.now();
    }
  }, []);

  if (isLoading) {
    return (
      <main className="fixed inset-0 bg-black flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
        <p className="text-white/60 text-sm">Memuat video...</p>
      </main>
    );
  }

  if (videoError && !episodeData) {
    return (
      <main className="fixed inset-0 bg-black flex flex-col items-center justify-center p-4">
        <AlertCircle className="w-12 h-12 text-destructive mb-4" />
        <h2 className="text-2xl font-bold text-white mb-4">Gagal memuat video</h2>
        <button onClick={() => router.back()} className="text-primary hover:underline">
          Kembali
        </button>
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
            href={`/detail/dramawave/${dramaId}`}
            className="flex items-center gap-2 text-white/90 hover:text-white transition-colors p-2 -ml-2 rounded-full hover:bg-white/10"
          >
            <ChevronLeft className="w-6 h-6" />
            <span className="text-primary font-bold hidden sm:inline shadow-black drop-shadow-md">DRAMASHORT</span>
          </Link>

          <div className="text-center flex-1 px-4 min-w-0">
            <h1 className="text-white font-medium truncate text-sm sm:text-base drop-shadow-md">{dramaTitle}</h1>
            <p className="text-white/80 text-xs drop-shadow-md">Episode {currentEpisode}</p>
          </div>

          <div className="flex items-center gap-2">
            {/* Quality Selector */}
            {episodeData?.qualityList && episodeData.qualityList.length > 1 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="p-2 text-white/90 hover:text-white transition-colors rounded-full hover:bg-white/10">
                    <Settings className="w-6 h-6 drop-shadow-md" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="z-[100]">
                  {episodeData.qualityList.map((q) => (
                    <DropdownMenuItem
                      key={q.url}
                      onClick={() => {
                        // Use master playlist URL for audio support
                        const masterUrl = q.url.replace(/_\d+\.m3u8$/, '.m3u8');
                        setSelectedQuality(masterUrl);
                      }}
                      className={selectedQuality === (q.url.replace(/_\d+\.m3u8$/, '.m3u8')) ? "text-primary font-semibold" : ""}
                    >
                      {q.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}

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

      {/* Video Player */}
      <div className="flex-1 w-full h-full relative bg-black flex flex-col items-center justify-center">
        <div className="relative w-full h-full flex items-center justify-center">
          {!isCurrentEpisodeLocked ? (
            <video
              ref={videoRef}
              controls
              autoPlay
              playsInline
              crossOrigin="anonymous"
              onEnded={handleVideoEnded}
              onTimeUpdate={handleTimeUpdate}
              className="w-full h-full object-contain max-h-[100dvh]"
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-white/60 gap-4">
              <AlertCircle className="w-16 h-16" />
              <p className="text-lg">Episode terkunci</p>
            </div>
          )}

          {/* Click to play overlay (for autoplay policy) */}
          {!isCurrentEpisodeLocked && !videoError && isLoading === false && videoRef.current && videoRef.current.paused && (
            <div
              className="absolute inset-0 flex items-center justify-center bg-black/40 z-20 cursor-pointer"
              onClick={() => { videoRef.current?.play().catch(() => { }); }}
            >
              <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center hover:bg-white/30 transition-all">
                <svg className="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
            </div>
          )}

          {/* Error Overlay */}
          {!isCurrentEpisodeLocked && videoError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 z-30">
              <AlertCircle className="w-12 h-12 text-destructive mb-4" />
              <p className="text-white text-lg mb-4">Gagal memuat video</p>
              <button
                onClick={() => {
                  setVideoError(false);
                  if (videoRef.current && selectedQuality) {
                    videoRef.current.src = selectedQuality;
                    videoRef.current.load();
                  }
                }}
                className="px-6 py-2 bg-primary text-white rounded-full hover:scale-105 transition-transform"
              >
                Coba Lagi
              </button>
            </div>
          )}
        </div>

        {/* Navigation Controls */}
        <div className={`absolute bottom-20 md:bottom-12 left-0 right-0 z-40 pointer-events-none flex justify-center pb-safe-area-bottom ${showEpisodeList ? "opacity-0" : "opacity-100"}`}>
          <div className="flex items-center gap-2 md:gap-6 pointer-events-auto bg-black/60 backdrop-blur-md px-3 py-1.5 md:px-6 md:py-3 rounded-full border border-white/10 shadow-lg transition-all scale-90 md:scale-100 origin-bottom">
            <button
              onClick={() => handleEpisodeChange(currentEpisode - 1)}
              disabled={currentEpisode <= 1}
              className="p-1.5 md:p-2 rounded-full text-white disabled:opacity-30 hover:bg-white/10 transition-colors"
            >
              <ChevronLeft className="w-4 h-4 md:w-6 md:h-6" />
            </button>

            <span className="text-white font-medium text-xs md:text-sm tabular-nums min-w-[60px] md:min-w-[80px] text-center">
              Ep {currentEpisode} / {totalEpisodes}
            </span>

            <button
              onClick={() => handleEpisodeChange(currentEpisode + 1)}
              disabled={currentEpisode >= totalEpisodes || (episodes.length > 0 && episodes[currentEpisode]?.locked === true)}
              className="p-1.5 md:p-2 rounded-full text-white disabled:opacity-30 hover:bg-white/10 transition-colors"
            >
              <ChevronRight className="w-4 h-4 md:w-6 md:h-6" />
            </button>
          </div>
        </div>
      </div>

      {/* Episode List Sidebar */}
      {showEpisodeList && totalEpisodes > 0 && (
        <>
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]" onClick={() => setShowEpisodeList(false)} />
          <div className="fixed inset-y-0 right-0 w-72 bg-zinc-900 z-[70] overflow-y-auto border-l border-white/10 shadow-2xl animate-in slide-in-from-right">
            <div className="p-4 border-b border-white/10 sticky top-0 bg-zinc-900 z-10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-white">Daftar Episode</h2>
                <span className="text-xs text-white/60 bg-white/10 px-2 py-0.5 rounded-full">Total {totalEpisodes}</span>
              </div>
              <button onClick={() => setShowEpisodeList(false)} className="p-1 text-white/70 hover:text-white">
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>
            <div className="p-3 grid grid-cols-5 gap-2">
              {Array.from({ length: totalEpisodes }, (_, i) => i + 1).map((ep) => {
                const epLocked = episodes.length > 0
                  ? episodes[ep - 1]?.locked === true
                  : false;
                return (
                  <button
                    key={ep}
                    onClick={() => !epLocked && handleEpisodeChange(ep)}
                    className={`
                      aspect-square flex items-center justify-center rounded-lg text-sm font-medium transition-all
                      ${ep === currentEpisode
                        ? "bg-primary text-white shadow-lg shadow-primary/20"
                        : epLocked
                          ? "bg-white/5 text-white/30 cursor-not-allowed"
                          : "bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
                      }
                    `}
                    disabled={epLocked}
                  >
                    {epLocked ? (
                      <span className="text-xs">🔒</span>
                    ) : (
                      ep
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </main>
  );
}