import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/auth";
import { q } from "@/lib/db";
import { uuid } from "@/lib/util";

// Einkaufsliste (Premium): eine Liste pro Nutzer, bewusst simpel.

function gate(user: { premium: boolean } | null) {
  if (!user) return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });
  if (!user.premium) return NextResponse.json({ error: "Premium erforderlich." }, { status: 402 });
  return null;
}

export async function GET() {
  const user = await getSessionUser();
  const blocked = gate(user);
  if (blocked) return blocked;
  const rows = await q<{
    id: string; barcode: string; checked: boolean;
    name: string; brand: string; scores: unknown; data: unknown;
  }>(
    `SELECT li.id, li.barcode, li.checked, p.name, p.brand, p.scores, p.data
     FROM list_items li JOIN products p ON p.barcode = li.barcode
     WHERE li.user_id = $1 ORDER BY li.checked ASC, li.created_at DESC`,
    [user!.id]
  );
  const items = rows.map((r) => {
    const scores = typeof r.scores === "string" ? JSON.parse(r.scores) : (r.scores as { total: number });
    const data = typeof r.data === "string" ? JSON.parse(r.data) : (r.data as { category?: string });
    return {
      id: r.id,
      barcode: r.barcode,
      checked: r.checked,
      name: r.name,
      brand: r.brand,
      category: data.category ?? "other",
      total: (scores as { total: number }).total,
    };
  });
  return NextResponse.json({ items });
}

export async function POST(req: Request) {
  const user = await getSessionUser();
  const blocked = gate(user);
  if (blocked) return blocked;
  const parsed = z
    .object({ barcode: z.string().regex(/^\d{6,14}$/) })
    .safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Ungültiger Barcode." }, { status: 400 });
  await q(
    `INSERT INTO list_items (id, user_id, barcode) VALUES ($1, $2, $3)
     ON CONFLICT (user_id, barcode) DO NOTHING`,
    [uuid(), user!.id, parsed.data.barcode]
  );
  return NextResponse.json({ ok: true });
}

export async function PATCH(req: Request) {
  const user = await getSessionUser();
  const blocked = gate(user);
  if (blocked) return blocked;
  const parsed = z
    .object({ id: z.string().uuid(), checked: z.boolean() })
    .safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Ungültige Daten." }, { status: 400 });
  await q(`UPDATE list_items SET checked = $1 WHERE id = $2 AND user_id = $3`, [
    parsed.data.checked,
    parsed.data.id,
    user!.id,
  ]);
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const user = await getSessionUser();
  const blocked = gate(user);
  if (blocked) return blocked;
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id fehlt." }, { status: 400 });
  await q(`DELETE FROM list_items WHERE id = $1 AND user_id = $2`, [id, user!.id]);
  return NextResponse.json({ ok: true });
}
