import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { checkPersonal, hasConflict } from "@/lib/personal";
import { getProduct, productsByCategory } from "@/lib/repo/products";

/**
 * Intelligente Alternativen (Premium):
 * - Widerspricht das Produkt dem Nutzerprofil → konfliktfreie Alternativen.
 * - Passt es → Alternativen mit besserem Gesamtscore.
 * Quelle: eigene Datenbank (gleiche Kategorie).
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ barcode: string }> }
) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });
  if (!user.premium) {
    return NextResponse.json({ error: "Premium erforderlich." }, { status: 402 });
  }

  const { barcode } = await params;
  const product = await getProduct(barcode);
  if (!product) return NextResponse.json({ error: "Produkt nicht gefunden." }, { status: 404 });

  const conflictMode = hasConflict(product, user.dietPrefs);
  const candidates = await productsByCategory(product.category, barcode, 16);

  const alternatives = candidates
    .filter((c) => !hasConflict(c, user.dietPrefs))
    .filter((c) => (conflictMode ? true : c.scores.total > product.scores.total))
    .slice(0, 4)
    .map((c) => ({
      product: c,
      matches: checkPersonal(c, user.dietPrefs).filter((e) => e.level === "match"),
      delta: c.scores.total - product.scores.total,
    }));

  return NextResponse.json({
    mode: conflictMode ? "conflict-free" : "better-score",
    alternatives,
  });
}
