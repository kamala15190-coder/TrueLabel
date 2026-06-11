import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { q } from "@/lib/db";

// CSV-Export der Einkaufsliste (Premium).

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });
  if (!user.premium) return NextResponse.json({ error: "Premium erforderlich." }, { status: 402 });

  const rows = await q<{ barcode: string; checked: boolean; name: string; brand: string }>(
    `SELECT li.barcode, li.checked, p.name, p.brand
     FROM list_items li JOIN products p ON p.barcode = li.barcode
     WHERE li.user_id = $1 ORDER BY li.checked ASC, li.created_at DESC`,
    [user.id]
  );
  const esc = (s: string) => `"${s.replace(/"/g, '""')}"`;
  const lines = [
    "Erledigt;Barcode;Produkt;Marke",
    ...rows.map((r) => [r.checked ? "ja" : "nein", r.barcode, esc(r.name), esc(r.brand)].join(";")),
  ];
  return new NextResponse("﻿" + lines.join("\r\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="truelabel-einkaufsliste.csv"',
    },
  });
}
