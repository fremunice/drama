"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useDramaNovaDetail } from "@/hooks/useDramaNova";
import { ChevronLeft, ChevronRight, Loader2, List, AlertCircle, Settings } from "lucide-react";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface VideoQuality {
  name: string;
  url: string;
}

export default function DramaNovaWatchPage() {
  const params = useParams<{ dramaId: string; episodeId: string }>();
  const router = useRouter();
  const [showEpisodeList, setShowEpisodeList] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [selectedQuality, setSelectedQuality] = useState<VideoQuality | null>(null);

  // Internal state for episodeId to prevent page unmount/remount on navigation
  const [currentEpisodeId, setCurrentEpisodeId] = useState(params.episodeId || "");

  // Sync state with params if they change externally (e.g. back button)
  useEffect(() => {
    if (params.episodeId && params.episodeId !== currentEpisodeId) {
      setCurrentEpisodeId(params.episodeId);
    }
  }, [params.episodeId]);

  // Keep previous data to avoid unmounting video during transitions
  // detailData returns { data: DramaNovaDetailData } structure wrapped from response
  const { data: dramaDetail, isLoading: detailLoading } = useDramaNovaDetail(params.dramaId || "");

  // Identify the current episode metadata
  const currentEpisodeIndex = useMemo(() => {
    if (!dramaDetail?.episodes) return -1;
    return dramaDetail.episodes.findIndex(ep => String(ep.number || ep.id) === currentEpisodeId);
  }, [dramaDetail, currentEpisodeId]);

  const currentEpisodeDetails = currentEpisodeIndex !== -1 ? dramaDetail?.episodes?.[currentEpisodeIndex] : null;

  // Get video URL directly from episode data, proxied for CORS
  const rawVideoUrl = currentEpisodeDetails?.videoUrl
    || currentEpisodeDetails?.qualityList?.[0]?.url
    || "";

  const videoUrl = rawVideoUrl ? `/api/proxy/video?source=dramanova&url=${encodeURIComponent(rawVideoUrl)}` : "";

  const qualities = useMemo(() => {
    if (!currentEpisodeDetails?.qualityList) return [];
    return currentEpisodeDetails.qualityList.map((q: any) => ({
      name: q.label || "Normal",
      url: `/api/proxy/video?source=dramanova&url=${encodeURIComponent(q.url || "")}`,
    }));
  }, [currentEpisodeDetails]);

  const currentQuality = selectedQuality?.url || videoUrl;

  // Set default quality once per episode
  useEffect(() => {
    setSelectedQuality(null);
    if (qualities.length > 0) {
      const nextQuality = qualities.find(q => q.name === "720p") || qualities.find(q => q.name === "1080p") || qualities[0];
      setSelectedQuality(nextQuality);
    } else if (rawVideoUrl) {
      setSelectedQuality({ name: "Auto", url: `/api/proxy/video?source=dramanova&url=${encodeURIComponent(rawVideoUrl)}` });
    }
  }, [currentEpisodeId]);

  const totalEpisodes = dramaDetail?.totalEpisodes || dramaDetail?.episodes?.length || 0;

  const handleEpisodeChange = (index: number) => {
    if (!dramaDetail?.episodes?.[index]) return;
    const nextEpisodeId = String(dramaDetail.episodes[index].number || dramaDetail.episodes[index].id);

    // Update internal state
    setCurrentEpisodeId(nextEpisodeId);

    // Update URL without triggering navigation
    const newUrl = `/watch/dramanova/${params.dramaId}/${nextEpisodeId}`;
    window.history.pushState({ path: newUrl }, "", newUrl);

    setShowEpisodeList(false);
  };

  const handleVideoEnded = () => {
    if (currentEpisodeIndex !== -1 && currentEpisodeIndex < totalEpisodes - 1) {
      handleEpisodeChange(currentEpisodeIndex + 1);
    }
  };

  // Guard: If logic fails completely and we have no data after loading
  if (!detailLoading && !dramaDetail) {
    return (
      <main className="fixed inset-0 bg-black flex flex-col items-center justify-center p-4">
        <AlertCircle className="w-12 h-12 text-destructive mb-4" />
        <h2 className="text-2xl font-bold text-white mb-4">Video tidak ditemukan</h2>
        <button onClick={() => router.back()} className="text-primary hover:underline">
          Kembali
        </button>
      </main>
    )
  }

  return (
    <main className="fixed inset-0 bg-black flex flex-col">
      {/* Header Overlay */}
      <div className="absolute top-0 left-0 right-0 z-40 h-16 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-black/90 via-black/50 to-transparent" />
        <div className="relative z-10 flex items-center justify-between h-full px-4 max-w-7xl mx-auto pointer-events-auto">
          <Link
            href={`/detail/dramanova/${params.dramaId}`}
            className="flex items-center gap-2 text-white/90 hover:text-white transition-colors p-2 -ml-2 rounded-full hover:bg-white/10"
          >
            <ChevronLeft className="w-6 h-6" />
            <span className="text-primary font-bold hidden sm:inline shadow-black drop-shadow-md">DRAMASHORT</span>
          </Link>

          <div className="text-center flex-1 px-4 min-w-0">
            <h1 className="text-white font-medium truncate text-sm sm:text-base drop-shadow-md">
              {dramaDetail?.title || "Loading..."}
            </h1>
            <p className="text-white/80 text-xs drop-shadow-md">
              Episode {currentEpisodeDetails?.episodeNumber || (currentEpisodeIndex !== -1 ? currentEpisodeIndex + 1 : "...")}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Quality Selector */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="p-2 text-white/90 hover:text-white transition-colors rounded-full hover:bg-white/10 flex items-center gap-1">
                  <Settings className="w-6 h-6 drop-shadow-md" />
                  <span className="text-xs font-bold drop-shadow-md hidden sm:inline">{selectedQuality?.name || "..."}</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-black/90 border-white/10 text-white">
                {qualities.map((q) => (
                  <DropdownMenuItem
                    key={q.name}
                    className={`cursor-pointer ${selectedQuality?.name === q.name ? "bg-white/20" : "hover:bg-white/10"}`}
                    onClick={() => setSelectedQuality(q)}
                  >
                    {q.name}
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

      {/* Video Player */}
      <div className="flex-1 w-full h-full relative bg-black flex flex-col items-center justify-center">
        <div className="relative w-full h-full flex items-center justify-center">
          {/* 
                 Video Element:
                 We remove the 'key' to allow the VIDEO element to be reused across renders.
                 This is CRITICAL for maintaining Fullscreen status automatically across episodes.
             */}
{selectedQuality ? <video ref={videoRef} src={selectedQuality.url} controls autoPlay playsInline crossOrigin="anonymous" onEnded={handleVideoEnded} className="w-full h-full object-contain max-h-[100dvh]" /> : currentEpisodeDetails?.locked ? <div className="w-full h-full flex flex-col items-center justify-center text-white/50 gap-2"><AlertCircle className="w-8 h-8" /><p className="text-sm">Episode terkunci</p></div> : <div className="w-full h-full flex items-center justify-center text-white/50"><Loader2 className="w-8 h-8 animate-spin" /></div>}
          </div>
        </div>

        {/* Navigation Controls */}
        <div className="absolute bottom-20 md:bottom-12 left-0 right-0 z-40 pointer-events-none flex justify-center">
          <div className="flex items-center gap-2 md:gap-6 pointer-events-auto bg-black/60 backdrop-blur-md px-3 py-1.5 md:px-6 md:py-3 rounded-full border border-white/10 shadow-lg">
            <button onClick={() => handleEpisodeChange(currentEpisodeIndex - 1)} disabled={currentEpisodeIndex <= 0} className="p-1.5 md:p-2 rounded-full text-white disabled:opacity-30 hover:bg-white/10 transition-colors">
              <ChevronLeft className="w-4 h-4 md:w-6 md:h-6" />
            </button>
            <span className="text-white font-medium text-xs md:text-sm min-w-[60px] md:min-w-[80px] text-center">
              Ep {currentEpisodeIndex + 1} / {totalEpisodes}
            </span>
            <button onClick={() => handleEpisodeChange(currentEpisodeIndex + 1)} disabled={currentEpisodeIndex >= totalEpisodes - 1} className="p-1.5 md:p-2 rounded-full text-white disabled:opacity-30 hover:bg-white/10 transition-colors">
              <ChevronRight className="w-4 h-4 md:w-6 md:h-6" />
            </button>
          </div>
        </div>

      {/* Episode List Sidebar */}
      {showEpisodeList && totalEpisodes > 0 && (
        <>
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]" onClick={() => setShowEpisodeList(false)} />
          <div className="fixed inset-y-0 right-0 w-72 bg-zinc-900 z-[70] overflow-y-auto border-l border-white/10 shadow-2xl">
            <div className="p-4 border-b border-white/10 sticky top-0 bg-zinc-900 z-10 flex items-center justify-between">
              <h2 className="font-bold text-white">Daftar Episode</h2>
              <button onClick={() => setShowEpisodeList(false)} className="p-1 text-white/70 hover:text-white">
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>
            <div className="p-3 grid grid-cols-5 gap-2">
              {dramaDetail?.episodes?.map((ep: any, idx: number) => (
                <button
                  key={ep.number || idx}
                  onClick={() => handleEpisodeChange(idx)}
                  className={`aspect-square flex items-center justify-center rounded-lg text-sm font-medium transition-all ${
                    idx === currentEpisodeIndex
                      ? "bg-primary text-white shadow-lg shadow-primary/20"
                      : "bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  {ep.number || idx + 1}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </main>
  );
}