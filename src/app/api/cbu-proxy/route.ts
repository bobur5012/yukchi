import { NextResponse } from "next/server";

const CBU_URL = "https://cbu.uz/ru/arkhiv-kursov-valyut/json/";

export async function GET() {
  try {
    const res = await fetch(CBU_URL, { next: { revalidate: 3600 } });
    if (!res.ok) throw new Error(`CBU API error: ${res.status}`);
    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    console.error("CBU proxy error:", err);
    return NextResponse.json(
      { error: "Failed to fetch exchange rates" },
      { status: 502 }
    );
  }
}
