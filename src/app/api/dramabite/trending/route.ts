import { NextResponse } from "next/server";

const UPSTREAM_API = process.env.NEXT_PUBLIC_V1_API_BASE_URL || "https://api.anichin.bio";
const PROVIDER = "dramabite";
const HEADERS = { "User-Agent": "Mozilla/5.0", "X-API-Key": process.env.V1_API_KEY || "" };

export async function GET() {
  try {
    const response = await fetch(`${UPSTREAM_API}/${PROVIDER}/trending`, {
      headers: HEADERS,
    });

    if (!response.ok) {
      console.warn(`[${PROVIDER} Trending] Upstream error:`, response.status);
      return NextResponse.json({ code: 200, items: [], hasMore: false });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error(`${PROVIDER} trending error:`, error);
    return NextResponse.json({ code: 200, items: [], hasMore: false });
  }
}