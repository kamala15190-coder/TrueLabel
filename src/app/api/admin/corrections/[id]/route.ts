import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/auth";
import { getCorrection, resolveCorrection } from "@/lib/repo/community";
import { applyFieldUpdate } from "@/lib/repo/products";
import { addPoints } from "@/lib/repo/users";

const schema = z.object({
  action: z.enum(["accept", "reject"]),
  value: z.string().max(3000).optional(),
  note: z.string().max(500).optional(),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Kein Zugriff." }, { status: 403 });
  }
  const { id } = await params;
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Ungültige Daten." }, { status: 400 });

  const correction = await getCorrection(id);
  if (!correction) return NextResponse.json({ error: "Nicht gefunden." }, { status: 404 });
  if (correction.status === "accepted" || correction.status === "rejected") {
    return NextResponse.json({ error: "Bereits entschieden." }, { status: 409 });
  }

  if (parsed.data.action === "accept") {
    const value = parsed.data.value ?? correction.suggested_value ?? undefined;
    let applied = false;
    if (value) {
      applied = await applyFieldUpdate(correction.barcode, correction.field, value);
    }
    await resolveCorrection(
      id,
      "accepted",
      parsed.data.note ?? (applied ? "Übernommen." : "Akzeptiert (manuell umgesetzt).")
    );
    await addPoints(correction.user_id, 10, `Korrektur übernommen: ${correction.barcode}`);
    return NextResponse.json({ ok: true, applied });
  }

  await resolveCorrection(id, "rejected", parsed.data.note ?? "Abgelehnt.");
  return NextResponse.json({ ok: true });
}
