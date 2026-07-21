import { NextRequest, NextResponse } from "next/server";
import { safeJson } from "@/lib/api-utils";

const PROVIDER = "dramawave";
const HEADERS = { "User-Agent": "okhttp/4.12.0", "X-API-Key": process.env.V1_API_KEY || "" };
const UPSTREAM_API = (process.env.NEXT_PUBLIC_V1_API_BASE_URL || "https://api.anichin.bio") + "/dramawave";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const page = searchParams.get("page") || "1";

  try {
    const response = await fetch(`${UPSTREAM_API}/foryou?page=${page}`, {
      cache: 'no-store',
      headers: HEADERS
    });

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