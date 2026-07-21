"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function FreeReelsWatchPage() {
  const params = useParams();
  const router = useRouter();
  const bookId = params.bookId as string;

  useEffect(() => {
    if (bookId) {
      router.replace(`/watch/freereels/${bookId}/1`);
    }
  }, [bookId, router]);

  return (
    <main className="fixed inset-0 bg-black flex flex-col items-center justify-center">
      <Loader2 className="w-12 h-12 animate-spin text-primary" />
    </main>
  );
}