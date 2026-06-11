import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { aiCacheStats, aiStatus } from "@/lib/mistral";
import { listCorrections } from "@/lib/repo/community";
import { countProducts, listUnverified } from "@/lib/repo/products";

export async function GET() {
  const user = await getSessionUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Kein Zugriff." }, { status: 403 });
  }
  const [pending, recent, unverified, products, ai, cache] = await Promise.all([
    listCorrections("manual"),
    listCorrections(undefined, 30),
    listUnverified(),
    countProducts(),
    aiStatus(),
    aiCacheStats(),
  ]);
  return NextResponse.json({
    pendingCorrections: pending,
    recentCorrections: recent,
    unverifiedProducts: unverified,
    productCount: products,
    ai,
    cache,
  });
}
