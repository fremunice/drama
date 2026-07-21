import { NextRequest, NextResponse } from "next/server";

const PROVIDER = "flickreels";
const HEADERS = { "User-Agent": "okhttp/4.12.0", "X-API-Key": process.env.V2_API_KEY || "" };
const UPSTREAM_API = (process.env.NEXT_PUBLIC_V2_API_BASE_URL || "https://priv-api.anichin.bio/api") + "/flickreels";

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get("id");
    const ep = searchParams.get("ep");
    const ts = searchParams.get("ts");
    const sig = searchParams.get("sig");

    if (!id || !ep || !ts || !sig) {
        return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    try {
        const upstreamUrl = `${UPSTREAM_API}/hls?id=${encodeURIComponent(id)}&ep=${encodeURIComponent(ep)}&ts=${encodeURIComponent(ts)}&sig=${encodeURIComponent(sig)}`;

        const response = await fetch(upstreamUrl, {
            headers: HEADERS
        });

        if (!response.ok) {
            return NextResponse.json({ error: "Failed to fetch HLS data" }, { status: response.status });
        }

        const contentType = response.headers.get("content-type") || "";
        const data = await response.text();

        // If it's an M3U8 playlist, rewrite segment URLs to go through our proxy
        if (contentType.includes("mpegurl") || contentType.includes("m3u8") || data.includes("#EXTM3U")) {
            const baseUrl = new URL(upstreamUrl);
            const rewritten = data.split(/\r?\n/).map(line => {
                const trimmed = line.trim();
                if (!trimmed || trimmed.startsWith("#")) return line;
                try {
                    const absoluteUrl = new URL(trimmed, baseUrl.origin + baseUrl.pathname).href;
                    return `/api/proxy/video?url=${encodeURIComponent(absoluteUrl)}`;
                } catch {
                    return line;
                }
            }).join("\n");

            return new NextResponse(rewritten, {
                headers: {
                    "Content-Type": "application/vnd.apple.mpegurl",
                    "Access-Control-Allow-Origin": "*",
                }
            });
        }

        // For non-M3U8 responses (JSON, etc.), forward as-is
        return new NextResponse(data, {
            headers: {
                "Content-Type": contentType || "application/octet-stream",
                "Access-Control-Allow-Origin": "*",
            }
        });

    } catch (error) {
        console.error("FlickReels HLS Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
