import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/auth";
import { q } from "@/lib/db";
import { uuid } from "@/lib/util";

// Lokalen (anonymen) Verlauf nach dem Login in das Konto übernehmen.
const schema = z.object({
  items: z
    .array(z.object({ barcode: z.string().regex(/^\d{6,14}$/), at: z.string() }))
    .max(100),
});

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Ungültige Daten." }, { status: 400 });

  let merged = 0;
  for (const item of parsed.data.items) {
    const at = new Date(item.at);
    if (Number.isNaN(at.getTime())) continue;
    // nur Produkte mergen, die in der DB existieren
    const exists = await q<{ barcode: string }>(
      `SELECT barcode FROM products WHERE barcode = $1`,
      [item.barcode]
    );
    if (exists.length === 0) continue;
    const dupe = await q<{ id: string }>(
      `SELECT id FROM scans WHERE user_id = $1 AND barcode = $2 AND created_at = $3`,
      [user.id, item.barcode, at]
    );
    if (dupe.length > 0) continue;
    await q(`INSERT INTO scans (id, user_id, barcode, created_at) VALUES ($1, $2, $3, $4)`, [
      uuid(),
      user.id,
      item.barcode,
      at,
    ]);
    merged++;
  }
  return NextResponse.json({ merged });
}
