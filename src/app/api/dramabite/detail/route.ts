import { type NextRequest, NextResponse } from "next/server";

const PROVIDER = "dramabite";
const UPSTREAM_API = process.env.NEXT_PUBLIC_V1_API_BASE_URL || "https://api.anichin.bio";
const HEADERS = { "User-Agent": "Mozilla/5.0", "X-API-Key": process.env.V1_API_KEY || "" };

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ code: 200, data: null });
  }

  try {
    const response = await fetch(`${UPSTREAM_API}/${PROVIDER}/detail?id=${id}`, {
      headers: HEADERS,
    });

    if (!response.ok) {
      console.warn(`[${PROVIDER} Detail] Upstream error:`, response.status);
      return NextResponse.json({ code: 200, data: null });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error(`${PROVIDER} detail error:`, error);
    return NextResponse.json({ code: 200, data: null });
  }
}