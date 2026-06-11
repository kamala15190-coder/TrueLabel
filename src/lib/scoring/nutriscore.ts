import type { Nutriments } from "../types";

// ============================================================
// Nutri-Score-Punkteberechnung (Algorithmus 2017, allgemeine
// Lebensmittel). Quelle: Santé publique France / BMEL.
// Negativ: Energie, Zucker, gesättigte Fette, Natrium.
// Positiv: Obst/Gemüse-Anteil, Ballaststoffe, Protein.
// ============================================================

const stepPoints = (v: number, steps: number[]) => steps.filter((s) => v > s).length;

/** Nutri-Score-Punkte (-15 … 40). null wenn Nährwerte fehlen. */
export function nutriPoints(n: Nutriments): number | null {
  if (n.energyKcal == null && n.sugars == null && n.satFat == null && n.salt == null) {
    return null;
  }
  const energyKj = (n.energyKcal ?? 0) * 4.184;
  const sodiumMg = (n.salt ?? 0) * 400; // Salz g → Natrium mg

  const neg =
    stepPoints(energyKj, [335, 670, 1005, 1340, 1675, 2010, 2345, 2680, 3015, 3350]) +
    stepPoints(n.sugars ?? 0, [4.5, 9, 13.5, 18, 22.5, 27, 31, 36, 40, 45]) +
    stepPoints(n.satFat ?? 0, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]) +
    stepPoints(sodiumMg, [90, 180, 270, 360, 450, 540, 630, 720, 810, 900]);

  const fruits = n.fruitsVegPct ?? 0;
  const fruitPts = fruits > 80 ? 5 : fruits > 60 ? 2 : fruits > 40 ? 1 : 0;
  const fiberPts = stepPoints(n.fiber ?? 0, [0.9, 1.9, 2.8, 3.7, 4.7]);
  const proteinPts = stepPoints(n.protein ?? 0, [1.6, 3.2, 4.8, 6.4, 8.0]);

  // Regel: Bei ≥11 Negativpunkten zählt Protein nur, wenn Obst/Gemüse 5 Punkte bringt.
  const pos = fruitPts + fiberPts + (neg >= 11 && fruitPts < 5 ? 0 : proteinPts);

  return neg - pos;
}

export function nutriGrade(points: number): "a" | "b" | "c" | "d" | "e" {
  if (points <= -1) return "a";
  if (points <= 2) return "b";
  if (points <= 10) return "c";
  if (points <= 18) return "d";
  return "e";
}

/** Nutri-Score-Punkte (-15…40) → Basis-Gesundheitsscore (0–100). */
export function pointsToBase(points: number): number {
  return Math.max(0, Math.min(100, Math.round(((40 - points) / 55) * 100)));
}

export const GRADE_BASE: Record<string, number> = { a: 90, b: 75, c: 55, d: 35, e: 15 };
