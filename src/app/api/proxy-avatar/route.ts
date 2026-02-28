import { NextRequest, NextResponse } from "next/server";

/**
 * Image proxy that adds Bearer auth to requests for private S3 storage.
 * Usage: /api/proxy-avatar?url=<encoded_full_url>
 *
 * The JWT token is read from the `yukchi_token` cookie (set by auth.ts on login/rehydrate).
 */
export async function GET(req: NextRequest) {
  const rawUrl = req.nextUrl.searchParams.get("url");
  if (!rawUrl) {
    return new NextResponse("Missing url parameter", { status: 400 });
  }

  let targetUrl: string;
  try {
    targetUrl = decodeURIComponent(rawUrl);
    new URL(targetUrl);
  } catch {
    return new NextResponse("Invalid url", { status: 400 });
  }

  const token = req.cookies.get("yukchi_token")?.value;

  try {
    const upstream = await fetch(targetUrl, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      next: { revalidate: 3600 },
    });

    if (!upstream.ok) {
      return new NextResponse(null, { status: upstream.status });
    }

    const buffer = await upstream.arrayBuffer();
    const contentType = upstream.headers.get("content-type") || "image/jpeg";

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
      },
    });
  } catch {
    return new NextResponse("Proxy error", { status: 502 });
  }
}
