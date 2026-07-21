"use client";

import { useParams, useRouter, useSearchParams, usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { Play, ChevronLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { UnifiedErrorDisplay } from "./UnifiedErrorDisplay";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchJson } from "@/lib/fetcher";
import Hls from "hls.js";

export default function UnifiedWatchPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const provider = pathname.split("/")[2] || "dramawave";
  const id = params.id as string;
  const ep = searchParams.get("ep") || "1";

  const [videoUrl, setVideoUrl] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);

  useEffect(() => {
    async function fetchVideo() {
      try {
        setIsLoading(true);
        setError("");

        let apiUrl = `/api/${provider}/episode?id=${id}&ep=${ep}`;

        const data = await fetchJson<any>(apiUrl);
        const url = data.videoUrl || data.url || data.data?.videoUrl || data.data?.url || "";

        if (!url) {
          throw new Error("Video URL tidak ditemukan");
        }

        setVideoUrl(url);
      } catch (err) {
        console.error("Watch fetch error:", err);
        setError(err instanceof Error ? err.message : "Gagal memuat video");
      } finally {
        setIsLoading(false);
      }
    }

    if (id) {
      fetchVideo();
    }
  }, [id, provider, ep]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !videoUrl) return;

    if (videoUrl.includes(".m3u8")) {
      if (Hls.isSupported()) {
        if (hlsRef.current) {
          hlsRef.current.destroy();
        }
        const hls = new Hls();
        hls.loadSource(videoUrl);
        hls.attachMedia(video);
        hlsRef.current = hls;
      } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
        // Native HLS support (Safari)
        video.src = videoUrl;
      }
    } else {
      video.src = videoUrl;
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [videoUrl]);

  if (isLoading) {
    return <WatchSkeleton />;
  }

  if (error) {
    return (
      <div className="min-h-screen pt-24 px-4">
        <UnifiedErrorDisplay
          title="Gagal Memuat Video"
          message={error}
          onRetry={() => window.location.reload()}
          retryLabel="Coba Lagi"
        />
      </div>
    );
  }

  return (
    <main className="min-h-screen pt-16">
      <div className="container mx-auto px-4 py-6">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ChevronLeft className="w-5 h-5" />
          <span>Kembali</span>
        </button>

        <div className="aspect-video w-full max-w-5xl mx-auto bg-black rounded-xl overflow-hidden shadow-2xl">
          {error && (
            <div className="w-full h-full flex flex-col items-center justify-center text-red-400 gap-2">
              <p>{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-white text-sm"
              >
                Coba Lagi
              </button>
            </div>
          )}
          {videoUrl && !error && (
            <video
              ref={videoRef}
              controls
              className="w-full h-full"
              autoPlay
              playsInline
              crossOrigin="anonymous"
            />
          )}
          {!videoUrl && !error && (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              Video tidak tersedia
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

function WatchSkeleton() {
  return (
    <main className="min-h-screen pt-24 px-4">
      <div className="max-w-5xl mx-auto space-y-4">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="aspect-video w-full rounded-xl" />
      </div>
    </main>
  );
}
