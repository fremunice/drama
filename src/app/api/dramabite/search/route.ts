import { type NextRequest, NextResponse } from "next/server";

const UPSTREAM_API = process.env.NEXT_PUBLIC_V1_API_BASE_URL || "https://api.anichin.bio";
const PROVIDER = "dramabite";
const HEADERS = { "User-Agent": "Mozilla/5.0", "X-API-Key": process.env.V1_API_KEY || "" };

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get("query") || searchParams.get("q");

  if (!query) {
    return NextResponse.json({ code: 200, items: [] });
  }

  try {
    const response = await fetch(`${UPSTREAM_API}/${PROVIDER}/search?query=${encodeURIComponent(query)}`, {
      headers: HEADERS,
    });

    if (!response.ok) {
      console.warn(`[${PROVIDER} Search] Upstream error:`, response.status);
      return NextResponse.json({ code: 200, items: [] });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error(`${PROVIDER} search error:`, error);
    return NextResponse.json({ code: 200, items: [] });
  }
}