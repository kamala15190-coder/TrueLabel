import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/auth";
import { reviewCorrection } from "@/lib/mistral";
import { createCorrection } from "@/lib/repo/community";
import { applyFieldUpdate, getProduct } from "@/lib/repo/products";
import { addPoints } from "@/lib/repo/users";

const schema = z.object({
  barcode: z.string().regex(/^\d{6,14}$/),
  field: z.enum(["name", "brand", "quantity", "ingredientsText", "nutriments", "score", "other"]),
  message: z.string().min(10, "Bitte beschreibe die Korrektur (mind. 10 Zeichen).").max(500),
});

// Felder, die die KI direkt ändern darf
const AUTO_FIELDS = ["name", "brand", "quantity", "ingredientsText"];

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe." },
      { status: 400 }
    );
  }
  const { barcode, field, message } = parsed.data;

  const product = await getProduct(barcode);
  if (!product) return NextResponse.json({ error: "Produkt nicht gefunden." }, { status: 404 });

  // KI-Triage (gecacht + budgetiert). null = KI nicht verfügbar → manuelle Queue.
  const verdict = await reviewCorrection({ product, field, message }).catch(() => null);

  if (verdict?.verdict === "accept" && verdict.suggestedValue && AUTO_FIELDS.includes(field)) {
    const applied = await applyFieldUpdate(barcode, field, verdict.suggestedValue);
    if (applied) {
      await createCorrection({
        userId: user.id, barcode, field, message,
        suggestedValue: verdict.suggestedValue,
        status: "accepted", aiVerdict: verdict,
        resolutionNote: verdict.reason, resolved: true,
      });
      await addPoints(user.id, 10, `Korrektur übernommen: ${barcode}`);
      return NextResponse.json({ status: "accepted", reason: verdict.reason, points: 10 });
    }
  }

  if (verdict?.verdict === "reject") {
    await createCorrection({
      userId: user.id, barcode, field, message,
      status: "rejected", aiVerdict: verdict,
      resolutionNote: verdict.reason, resolved: true,
    });
    return NextResponse.json({ status: "rejected", reason: verdict.reason });
  }

  // alles andere → manuelle Prüfung im Admin-Panel
  await createCorrection({
    userId: user.id, barcode, field, message,
    suggestedValue: verdict?.suggestedValue,
    status: "manual", aiVerdict: verdict ?? null, resolved: false,
  });
  return NextResponse.json({
    status: "manual",
    reason:
      verdict?.reason ??
      "Deine Korrektur wird manuell geprüft. Du bekommst Punkte, sobald sie übernommen wurde.",
  });
}
