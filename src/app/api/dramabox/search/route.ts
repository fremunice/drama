import { NextRequest, NextResponse } from "next/server";
import { safeJson } from "@/lib/api-utils";

const PROVIDER = "dramabox";
const HEADERS = { "User-Agent": "okhttp/4.12.0", "X-API-Key": process.env.V2_API_KEY || "" };
const UPSTREAM_API = (process.env.NEXT_PUBLIC_V2_API_BASE_URL || "https://priv-api.anichin.bio/api") + "/dramabox";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get("q") || searchParams.get("query");

  if (!query) {
    return NextResponse.json([]);
  }

  try {
    const response = await fetch(
      `${UPSTREAM_API}/search?q=${encodeURIComponent(query)}`,
      { headers: HEADERS, cache: 'no-store' }
    );

    if (!response.ok) {
      return NextResponse.json({ error: "Failed to fetch data" }, { status: response.status });
    }

    const data = await safeJson(response);
    return NextResponse.json(data);
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}