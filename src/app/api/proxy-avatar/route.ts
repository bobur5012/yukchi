import { NextRequest, NextResponse } from "next/server";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ||
  (typeof window !== "undefined" ? "" : "http://localhost:3000") + "/api/v1";

/**
 * Image proxy for private S3 storage. Fetches a presigned URL from the backend
 * (authenticated with JWT), then proxies the image from S3.
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
  if (!token) {
    return new NextResponse(null, { status: 401 });
  }

  try {
    const presignRes = await fetch(
      `${API_BASE}/storage/presign?url=${encodeURIComponent(targetUrl)}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (!presignRes.ok) {
      return new NextResponse(null, { status: presignRes.status });
    }

    const json = (await presignRes.json()) as {
      signedUrl?: string;
      data?: { signedUrl?: string };
    };
    const signedUrl = json?.data?.signedUrl ?? json?.signedUrl;
    if (!signedUrl) {
      return new NextResponse("Presign failed", { status: 502 });
    }

    const upstream = await fetch(signedUrl, {
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
