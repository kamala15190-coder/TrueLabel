import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { listScans } from "@/lib/repo/community";
import type { Scores } from "@/lib/types";

// CSV-Export des Verlaufs (Premium). Semikolon + BOM für deutsches Excel.

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });
  if (!user.premium) return NextResponse.json({ error: "Premium erforderlich." }, { status: 402 });

  const rows = await listScans(user.id, 500);
  const esc = (s: string) => `"${s.replace(/"/g, '""')}"`;
  const lines = [
    "Datum;Barcode;Produkt;Marke;Gesamtscore;Gesundheit;Umwelt;Soziales",
    ...rows.map((r) => {
      const scores = (typeof r.scores === "string" ? JSON.parse(r.scores) : r.scores) as Scores;
      return [
        new Date(r.created_at).toLocaleString("de-DE"),
        r.barcode,
        esc(r.name),
        esc(r.brand),
        scores.total,
        scores.health.score,
        scores.eco.score,
        scores.social.score,
      ].join(";");
    }),
  ];
  return new NextResponse("﻿" + lines.join("\r\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="truelabel-verlauf.csv"',
    },
  });
}
