"use client";

import { UnifiedMediaCard } from "./UnifiedMediaCard";
import type { ReelShortBook } from "@/types/reelshort";

interface ReelShortCardProps {
  book: ReelShortBook;
  index?: number;
}

export function ReelShortCard({ book, index = 0 }: ReelShortCardProps) {
  return (
    <UnifiedMediaCard
      index={index}
      title={book.book_title || book.title || ""}
      cover={book.book_pic || book.cover || ""}
      link={book.book_id ? `/detail/reelshort/${book.book_id}` : "#"}
      episodes={book.chapter_count}
      topLeftBadge={{ text: "ReelShort", color: "#de0202" }}
      topRightBadge={book.rank_level ? {
        text: book.rank_level,
        isTransparent: true
      } : null}
    />
  );
}
