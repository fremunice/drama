import { NextRequest, NextResponse } from "next/server";

const PROVIDER = "dramabite";
const HEADERS = { "User-Agent": "Mozilla/5.0", "X-API-Key": process.env.V1_API_KEY || "" };
const UPSTREAM_API = process.env.NEXT_PUBLIC_V1_API_BASE_URL || "https://api.anichin.bio";

export async function GET(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get("id");
    const ep = req.nextUrl.searchParams.get("ep") || "1";

    if (!id) {
      return NextResponse.json({ code: 200, videoUrl: "" });
    }

    const res = await fetch(`${UPSTREAM_API}/${PROVIDER}/episode?id=${id}&ep=${ep}`, {
      headers: HEADERS,
    });

    if (!res.ok) {
      console.warn(`[${PROVIDER} Episode] Upstream error:`, res.status);
      return NextResponse.json({ code: 200, videoUrl: "" });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("dramabite episode fetch error:", error);
    return NextResponse.json({ code: 200, videoUrl: "" });
  }
}