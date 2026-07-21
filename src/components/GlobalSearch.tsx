"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, Loader2, X } from "lucide-react";
import { useDebounce } from "@/hooks/useDebounce";
import { useSearchDramas } from "@/hooks/useDramas";
import { usePineDramaSearch } from "@/hooks/usePineDrama";
import { useMeloloSearch } from "@/hooks/useMelolo";
import { useReelShortSearch } from "@/hooks/useReelShort";
import { useGoodShortSearch } from "@/hooks/useGoodShort";
import { useDramaNovaSearch } from "@/hooks/useDramaNova";
import { useNetShortSearch } from "@/hooks/useNetShort";
import { useShortMaxSearch } from "@/hooks/useShortMax";

interface SearchResult {
    id: string;
    title: string;
    cover: string;
    provider: string;
    link: string;
    episodes?: number;
}

export function GlobalSearch() {
    const router = useRouter();
    const [query, setQuery] = useState("");
    const [isOpen, setIsOpen] = useState(false);
    const [results, setResults] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const debouncedQuery = useDebounce(query, 400);

    // All provider search hooks (always enabled when query is non-empty)
    const dramaboxSearch = useSearchDramas(debouncedQuery);
    const pinedramaSearch = usePineDramaSearch(debouncedQuery);
    const meloloSearch = useMeloloSearch(debouncedQuery);
    const reelshortSearch = useReelShortSearch(debouncedQuery);
    const goodshortSearch = useGoodShortSearch(debouncedQuery);
    const dramanovaSearch = useDramaNovaSearch(debouncedQuery);
    const netshortSearch = useNetShortSearch(debouncedQuery);
    const shortmaxSearch = useShortMaxSearch(debouncedQuery);

    // Collect all search results
    useEffect(() => {
        if (!debouncedQuery) {
            setResults([]);
            return;
        }

        setLoading(true);

        const allResults: SearchResult[] = [];
        const searches = [
            { data: dramaboxSearch.data, provider: "DramaBox", linkPrefix: "/detail/dramabox/", idField: "id" },
            { data: pinedramaSearch.data, provider: "PineDrama", linkPrefix: "/detail/pinedrama/", idField: "id" },
            { data: meloloSearch.data, provider: "Melolo", linkPrefix: "/detail/melolo/", idField: "id" },
            { data: reelshortSearch.data, provider: "ReelShort", linkPrefix: "/detail/reelshort/", idField: "id" },
            { data: goodshortSearch.data, provider: "GoodShort", linkPrefix: "/detail/goodshort/", idField: "id" },

            { data: netshortSearch.data, provider: "NetShort", linkPrefix: "/detail/netshort/", idField: "id" },
            { data: dramanovaSearch.data, provider: "DramaNova", linkPrefix: "/detail/dramanova/", idField: "id" },
            { data: shortmaxSearch.data, provider: "ShortMax", linkPrefix: "/detail/shortmax/", idField: "id" },
        ];

        for (const search of searches) {
            if (!search.data) continue;
            const items = Array.isArray(search.data)
                ? search.data
                : (search.data as any)?.items || (search.data as any)?.data || [];

            for (const item of items.slice(0, 3)) {
                const id = item.id || item.bookId || item.dramaId || item.book_id || item.shortPlayId;
                if (!id) continue;
                allResults.push({
                    id,
                    title: item.title || item.bookName || item.book_name || item.name || "Untitled",
                    cover: item.cover || item.thumb_url || item.posterImg || item.coverUrl || "",
                    provider: search.provider,
                    link: `${search.linkPrefix}${id}`,
                    episodes: item.episodes || item.episode_count || item.totalEpisodes || 0,
                });
            }
        }

        setResults(allResults);
        setLoading(false);
        setIsOpen(allResults.length > 0);
    }, [debouncedQuery, dramaboxSearch.data, pinedramaSearch.data, meloloSearch.data, reelshortSearch.data, goodshortSearch.data, dramanovaSearch.data, netshortSearch.data, shortmaxSearch.data]);

    // Close on click outside
    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node) &&
                inputRef.current && !inputRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, []);

    const handleSelect = (result: SearchResult) => {
        setQuery("");
        setIsOpen(false);
        router.push(result.link);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Escape") {
            setIsOpen(false);
            inputRef.current?.blur();
        }
    };

    return (
        <div className="relative w-full max-w-md">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    suppressHydrationWarning
                    onChange={(e) => {
                        setQuery(e.target.value);
                        if (e.target.value) setIsOpen(true);
                    }}
                    onFocus={() => { if (results.length > 0) setIsOpen(true); }}
                    onKeyDown={handleKeyDown}
                    placeholder="Cari drama..."
                    className="w-full h-9 pl-9 pr-8 rounded-full bg-white/10 border border-white/10 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:bg-white/15 transition-colors"
                />
                {query && (
                    <button
                        onClick={() => { setQuery(""); setResults([]); setIsOpen(false); }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                        <X className="w-3.5 h-3.5" />
                    </button>
                )}
            </div>

            {/* Dropdown Results */}
            {isOpen && (
                <div
                    ref={dropdownRef}
                    className="absolute top-full mt-2 left-0 right-0 bg-zinc-900 border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50 max-h-[70vh] overflow-y-auto"
                >
                    {loading ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                        </div>
                    ) : results.length > 0 ? (
                        <div className="py-2">
                            {results.map((result, index) => (
                                <button
                                    key={`${result.provider}-${result.id}-${index}`}
                                    onClick={() => handleSelect(result)}
                                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/5 transition-colors text-left"
                                >
                                    <div className="w-10 h-14 rounded-lg overflow-hidden bg-white/10 shrink-0">
                                        {result.cover ? (
                                            <img
                                                src={result.cover}
                                                alt={result.title}
                                                className="w-full h-full object-cover"
                                                referrerPolicy="no-referrer"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
                                                N/A
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-foreground truncate">
                                            {result.title}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {result.provider}
                                            {result.episodes ? ` • ${result.episodes} eps` : ""}
                                        </p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    ) : debouncedQuery ? (
                        <div className="py-8 text-center text-sm text-muted-foreground">
                            Tidak ada hasil untuk "{debouncedQuery}"
                        </div>
                    ) : null}
                </div>
            )}
        </div>
    );
}
