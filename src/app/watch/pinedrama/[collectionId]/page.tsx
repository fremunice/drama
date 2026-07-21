"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { usePineDramaDetail, usePineDramaEpisode } from "@/hooks/usePineDrama";
import { Loader2, AlertCircle, List, Settings, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import Hls from "hls.js";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function PineDramaWatchPage() {
    const params = useParams<{ collectionId: string }>();
    const collectionId = params.collectionId;
    const searchParams = useSearchParams();
    const router = useRouter();
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const [showEpisodeList, setShowEpisodeList] = useState(false);
    const [quality, setQuality] = useState(720);

    const episodeNumber = parseInt(searchParams.get("ep") || "1", 10);

    const { data: detailData, isLoading: detailLoading } = usePineDramaDetail(collectionId || "");
    const { data: episodeData, isLoading: episodeLoading } = usePineDramaEpisode(collectionId || "", episodeNumber);

    const drama = useMemo(() => detailData?.data || detailData, [detailData]);
    const episodes = useMemo(() => drama?.episodeList || drama?.episodes || [], [drama]);
    const currentEpisodeIndex = useMemo(() => episodes.findIndex((ep: any) => ep.number === episodeNumber), [episodes, episodeNumber]);

    const videoUrl = useMemo(() => {
        if (!episodeData) return undefined;
        const epData = episodeData?.data || episodeData;
        const rawUrl = epData?.videoUrl || epData?.streamUrl || epData?.url || "";
        if (!rawUrl) return undefined;
        return `/api/proxy/video?source=pinedrama&url=${encodeURIComponent(rawUrl)}`;
    }, [episodeData]);

    const handleEpisodeChange = (epNumber: number, preserveFullscreen = false) => {
        if (preserveFullscreen) {
            window.history.replaceState(null, "", `/watch/pinedrama/${collectionId}?ep=${epNumber}`);
        } else {
            router.push(`/watch/pinedrama/${collectionId}?ep=${epNumber}`);
        }
    };

    const handleVideoEnded = () => {
        if (currentEpisodeIndex < episodes.length - 1) {
            const nextEp = episodes[currentEpisodeIndex + 1];
            if (nextEp?.number) handleEpisodeChange(nextEp.number, true);
        }
    };

    // HLS playback support
    useEffect(() => {
        const video = videoRef.current;
        if (!video || !videoUrl) return;
        const isHls = videoUrl.endsWith(".m3u8") || videoUrl.includes("/hls");
        const canPlayNative = video.canPlayType("application/vnd.apple.mpegurl");
        if (isHls && !canPlayNative && Hls.isSupported()) {
            const hls = new Hls();
            hls.loadSource(videoUrl);
            hls.attachMedia(video);
            return () => { hls.destroy(); };
        } else {
            video.src = videoUrl;
        }
    }, [videoUrl]);

    const loading = detailLoading || episodeLoading;
    const dramaTitle = drama?.title || "PineDrama";
    const totalEps = episodes.length || 1;

    if (loading) {
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

    if (!episodeData) {
        return (
            <main className="fixed inset-0 bg-black flex flex-col items-center justify-center p-4">
                <AlertCircle className="w-12 h-12 text-destructive mb-4" />
                <h2 className="text-2xl font-bold text-white mb-4">Episode tidak ditemukan</h2>
                <Link href={`/detail/pinedrama/${collectionId}`} className="text-primary hover:underline">Kembali ke detail</Link>
            </main>
        );
    }

    return (
        <main className="fixed inset-0 bg-black flex flex-col">
            {/* Header - Fixed Overlay */}
            <div className="absolute top-0 left-0 right-0 z-40 h-16 pointer-events-none">
                <div className="absolute inset-0 bg-gradient-to-b from-black/90 via-black/50 to-transparent" />
                <div className="relative z-10 flex items-center justify-between h-full px-4 max-w-7xl mx-auto pointer-events-auto">
                    <Link href={`/detail/pinedrama/${collectionId}`} className="flex items-center gap-2 text-white/90 hover:text-white transition-colors p-2 -ml-2 rounded-full hover:bg-white/10">
                        <ChevronLeft className="w-6 h-6" />
                        <span className="text-primary font-bold hidden sm:inline shadow-black drop-shadow-md">DRAMASHORT</span>
                    </Link>
                    <div className="text-center flex-1 px-4 min-w-0">
                        <h1 className="text-white font-medium truncate text-sm sm:text-base drop-shadow-md">{dramaTitle}</h1>
                        <p className="text-white/80 text-xs drop-shadow-md">Episode {episodeNumber} &middot; {totalEps}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button className="p-2 text-white/90 hover:text-white transition-colors rounded-full hover:bg-white/10">
                                    <Settings className="w-6 h-6 drop-shadow-md" />
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="z-[100] w-40">
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

            {/* Episode List Panel - Sidebar */}
            {showEpisodeList && (
                <>
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]" onClick={() => setShowEpisodeList(false)} />
                    <div className="fixed inset-y-0 right-0 w-72 bg-zinc-900 z-[70] overflow-y-auto border-l border-white/10 shadow-2xl animate-in slide-in-from-right">
                        <div className="p-4 border-b border-white/10 sticky top-0 bg-zinc-900 z-10 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <h2 className="font-bold text-white">Daftar Episode</h2>
                                <span className="text-xs text-white/60 bg-white/10 px-2 py-0.5 rounded-full">
                                    Total {totalEps}
                                </span>
                            </div>
                            <button onClick={() => setShowEpisodeList(false)} className="p-1 text-white/70 hover:text-white">
                                <ChevronRight className="w-6 h-6" />
                            </button>
                        </div>
                        <div className="p-3 grid grid-cols-5 gap-2">
                            {episodes.map((ep: any, idx: number) => (
                                <button
                                    key={ep.id || idx}
                                    onClick={() => handleEpisodeChange(ep.number)}
                                    className={`aspect-square flex items-center justify-center rounded-lg text-sm font-medium transition-all ${ep.number === episodeNumber ? "bg-primary text-white shadow-lg shadow-primary/20" : "bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"}`}
                                >
                                    {ep.number}
                                </button>
                            ))}
                        </div>
                    </div>
                </>
            )}

            {/* Main Video Area */}
            <div className="flex-1 w-full relative flex items-center justify-center">
                {videoUrl ? (
                    <video
                        ref={videoRef}
                        src={videoUrl}
                        className="w-full h-full object-contain max-h-[100dvh]"
                        controls
                        autoPlay
                        crossOrigin="anonymous"
                        onEnded={handleVideoEnded}
                    />
                ) : (
                    <div className="flex flex-col items-center justify-center gap-4 text-white/60">
                        <AlertCircle className="w-16 h-16" />
                        <p className="text-lg">Video tidak tersedia</p>
                    </div>
                )}
            </div>

            {/* Navigation Overlay */}
            <div className="absolute bottom-20 md:bottom-12 left-0 right-0 z-40 pointer-events-none flex justify-center pb-safe-area-bottom">
                <div className="flex items-center gap-2 md:gap-6 pointer-events-auto bg-black/60 backdrop-blur-md px-3 py-1.5 md:px-6 md:py-3 rounded-full border border-white/10 shadow-lg transition-all scale-90 md:scale-100 origin-bottom">
                    <button
                        onClick={() => currentEpisodeIndex > 0 && handleEpisodeChange(episodes[currentEpisodeIndex - 1].number)}
                        disabled={currentEpisodeIndex <= 0}
                        className="p-1.5 md:p-2 rounded-full text-white disabled:opacity-30 hover:bg-white/10 transition-colors"
                    >
                        <ChevronLeft className="w-4 h-4 md:w-6 md:h-6" />
                    </button>
                    <span className="text-white font-medium text-xs md:text-sm tabular-nums min-w-[60px] md:min-w-[80px] text-center">
                        {episodeNumber} / {totalEps}
                    </span>
                    <button
                        onClick={() => currentEpisodeIndex < episodes.length - 1 && handleEpisodeChange(episodes[currentEpisodeIndex + 1].number)}
                        disabled={currentEpisodeIndex >= episodes.length - 1}
                        className="p-1.5 md:p-2 rounded-full text-white disabled:opacity-30 hover:bg-white/10 transition-colors"
                    >
                        <ChevronRight className="w-4 h-4 md:w-6 md:h-6" />
                    </button>
                </div>
            </div>
        </main>
    );
}
