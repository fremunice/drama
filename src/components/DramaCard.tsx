import { UnifiedMediaCard } from "./UnifiedMediaCard";
import type { Drama } from "@/types/drama";

interface DramaCardProps {
  drama: Drama;
  index?: number;
}

export function DramaCard({ drama, index = 0 }: DramaCardProps) {
  const bookId = drama.bookId || drama.id || drama.dramaId;
  return (
    <UnifiedMediaCard
      index={index}
      title={drama.bookName || drama.title || ""}
      cover={drama.coverWap || drama.cover || ""}
      link={bookId ? `/detail/dramabox/${bookId}` : "#"}
      episodes={drama.chapterCount}
      topLeftBadge={{ text: "DramaBox", color: "#de0202" }}
      topRightBadge={drama.rankVo ? {
        text: drama.rankVo.hotCode || "",
        isTransparent: true
      } : null}
    />
  );
}
