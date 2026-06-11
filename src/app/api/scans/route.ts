import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/auth";
import { addScan, listScans } from "@/lib/repo/community";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });
  const rows = await listScans(user.id);
  const scans = rows.map((r) => {
    const data = typeof r.data === "string" ? JSON.parse(r.data) : (r.data as Record<string, unknown>);
    const scores = typeof r.scores === "string" ? JSON.parse(r.scores) : (r.scores as { total: number });
    return {
      id: r.id,
      barcode: r.barcode,
      createdAt: new Date(r.created_at).toISOString(),
      name: r.name,
      brand: r.brand,
      category: (data as { category?: string }).category ?? "other",
      total: (scores as { total: number }).total,
    };
  });
  return NextResponse.json({ scans });
}

const postSchema = z.object({ barcode: z.string().regex(/^\d{6,14}$/) });

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });
  const parsed = postSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Ungültiger Barcode." }, { status: 400 });
  await addScan(user.id, parsed.data.barcode);
  return NextResponse.json({ ok: true });
}
