import { NextResponse } from "next/server";
import { safeJson } from "@/lib/api-utils";

const PROVIDER = "dramabox";
const HEADERS = { "User-Agent": "okhttp/4.12.0", "X-API-Key": process.env.V1_API_KEY || "" };
const UPSTREAM_API = (process.env.NEXT_PUBLIC_V1_API_BASE_URL || "https://api.anichin.bio") + "/dramabox";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const targetUrl = new URL(`${UPSTREAM_API}/trending`);

    if (!searchParams.has('lang')) {
      targetUrl.searchParams.set('lang', 'id');
    }

    searchParams.forEach((value, key) => {
      targetUrl.searchParams.set(key, value);
    });

    const response = await fetch(targetUrl.toString(), {
      cache: 'no-store', headers: HEADERS
    });

    if (!response.ok) {
      return NextResponse.json({ error: "Failed to fetch data" }, { status: response.status });
    }

    const data = await safeJson(response);
    const filteredData = Array.isArray(data) ? data : ((data as any).items || []);

    return NextResponse.json(filteredData);
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}