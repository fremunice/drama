import { NextResponse } from "next/server";
import { safeJson } from "@/lib/api-utils";

const PROVIDER = "flickreels";
const HEADERS = { "User-Agent": "okhttp/4.12.0", "X-API-Key": process.env.V2_API_KEY || "" };
const UPSTREAM_API = (process.env.NEXT_PUBLIC_V2_API_BASE_URL || "https://priv-api.anichin.bio/api") + "/flickreels";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const page = searchParams.get("page") || "1";

    const response = await fetch(`${UPSTREAM_API}/trending?page=${page}`, {
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