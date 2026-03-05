import { NextRequest, NextResponse } from "next/server";
import { getServerApiBase } from "@/lib/api/base";

const HOP_BY_HOP_HEADERS = new Set([
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
  "host",
  "content-length",
]);

function buildTargetUrl(req: NextRequest, path: string[]): string {
  const base = getServerApiBase().replace(/\/+$/, "");
  const target = new URL(`${base}/${path.join("/")}`);
  req.nextUrl.searchParams.forEach((value, key) => {
    target.searchParams.append(key, value);
  });
  return target.toString();
}

function buildOutgoingHeaders(req: NextRequest): Headers {
  const headers = new Headers();
  req.headers.forEach((value, key) => {
    const lower = key.toLowerCase();
    if (HOP_BY_HOP_HEADERS.has(lower)) return;
    headers.set(key, value);
  });
  return headers;
}

function copyIncomingHeaders(upstream: Response, response: NextResponse): void {
  upstream.headers.forEach((value, key) => {
    const lower = key.toLowerCase();
    if (HOP_BY_HOP_HEADERS.has(lower)) return;
    if (lower === "set-cookie") return;
    response.headers.set(key, value);
  });

  const anyHeaders = upstream.headers as Headers & { getSetCookie?: () => string[] };
  if (typeof anyHeaders.getSetCookie === "function") {
    for (const setCookie of anyHeaders.getSetCookie()) {
      response.headers.append("set-cookie", setCookie);
    }
    return;
  }

  const singleSetCookie = upstream.headers.get("set-cookie");
  if (singleSetCookie) {
    response.headers.set("set-cookie", singleSetCookie);
  }
}

async function forward(req: NextRequest, path: string[]): Promise<NextResponse> {
  const targetUrl = buildTargetUrl(req, path);
  const method = req.method.toUpperCase();
  const outgoingHeaders = buildOutgoingHeaders(req);
  const init: RequestInit = {
    method,
    headers: outgoingHeaders,
    cache: "no-store",
    redirect: "manual",
  };

  if (method !== "GET" && method !== "HEAD") {
    init.body = await req.arrayBuffer();
  }

  const upstream = await fetch(targetUrl, init);
  let body: BodyInit;
  if (upstream.status >= 500) {
    const bodyText = await upstream.text();
    console.error(
      `[API Proxy] Upstream ${upstream.status} for ${method} ${targetUrl}:`,
      bodyText.slice(0, 500)
    );
    body = bodyText;
  } else {
    body = upstream.body ?? "";
  }
  const response = new NextResponse(body, { status: upstream.status });
  copyIncomingHeaders(upstream, response);
  return response;
}

type RouteContext = { params: Promise<{ path: string[] }> };

async function handle(req: NextRequest, context: RouteContext): Promise<NextResponse> {
  const { path } = await context.params;
  return forward(req, path ?? []);
}

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, context: RouteContext) {
  return handle(req, context);
}

export async function POST(req: NextRequest, context: RouteContext) {
  return handle(req, context);
}

export async function PUT(req: NextRequest, context: RouteContext) {
  return handle(req, context);
}

export async function PATCH(req: NextRequest, context: RouteContext) {
  return handle(req, context);
}

export async function DELETE(req: NextRequest, context: RouteContext) {
  return handle(req, context);
}

export async function OPTIONS(req: NextRequest, context: RouteContext) {
  return handle(req, context);
}

