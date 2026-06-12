import type { DimensionScore, Factor, ProductData } from "../types";
import { clamp, de } from "../util";
import { ADDITIVE_NAMES, ADDITIVE_RISK } from "./data";
import { GRADE_BASE, nutriGrade, nutriPoints, pointsToBase } from "./nutriscore";

// ============================================================
// Gesundheits-Score (0–100)
// Basis: Nutri-Score-Algorithmus. Abzüge: Zusatzstoffe nach
// Risikoklasse, Verarbeitungsgrad (NOVA).
// ============================================================

function nutrientFactor(
  id: string,
  label: string,
  value: number | undefined,
  unit: string,
  goodMax: number,
  badMin: number,
  invert = false
): Factor {
  if (value == null) {
    return { id, label, value: "—", points: 0, status: "info", pct: 0, note: "Keine Angabe" };
  }
  let status: Factor["status"];
  let pct: number;
  if (!invert) {
    // weniger ist besser (Zucker, Fett, Salz)
    status = value <= goodMax ? "good" : value <= badMin ? "medium" : "bad";
    pct = clamp(100 - (value / (badMin * 2)) * 100);
  } else {
    // mehr ist besser (Ballaststoffe)
    status = value >= badMin ? "good" : value >= goodMax ? "medium" : "info";
    pct = clamp((value / (badMin * 1.5)) * 100);
  }
  return { id, label, value: `${de(value)} ${unit}`, points: 0, status, pct };
}

export function computeHealth(p: ProductData): DimensionScore {
  const factors: Factor[] = [];
  const n = p.nutriments;

  // --- Basis: Nutri-Score ---
  const pts = nutriPoints(n);
  const grade = (p.nutriscoreGrade ?? (pts != null ? nutriGrade(pts) : undefined))?.toLowerCase();
  let base: number;
  if (pts != null) {
    base = pointsToBase(pts);
  } else if (grade && GRADE_BASE[grade] != null) {
    base = GRADE_BASE[grade];
  } else {
    base = 50;
  }

  factors.push({
    id: "nutriscore",
    label: "Nutri-Score",
    value: grade ? `Klasse ${grade.toUpperCase()}` : "Nicht berechenbar",
    points: 0,
    status: grade ? (grade <= "b" ? "good" : grade === "c" ? "medium" : "bad") : "info",
    pct: base,
    note: grade
      ? "Berechnet aus Energie, Zucker, Fett, Salz, Ballaststoffen und Protein je 100 g."
      : "Es liegen nicht genug Nährwertdaten vor. Basiswert 50.",
  });

  // --- Transparenz-Faktoren (im Nutri-Score enthalten, hier erklärt) ---
  factors.push(nutrientFactor("sugar", "Zucker", n.sugars, "g/100 g", 5, 22.5));
  factors.push(nutrientFactor("satfat", "Gesättigte Fette", n.satFat, "g/100 g", 1.5, 5));
  factors.push(nutrientFactor("salt", "Salz", n.salt, "g/100 g", 0.3, 1.5));
  factors.push(nutrientFactor("fiber", "Ballaststoffe", n.fiber, "g/100 g", 3, 6, true));

  // --- Zusatzstoffe ---
  let additivePenalty = 0;
  if (p.additives.length === 0) {
    factors.push({
      id: "additives",
      label: "Zusatzstoffe",
      value: "Keine gefunden",
      points: 0,
      status: "good",
      pct: 100,
    });
  } else {
    const risky: string[] = [];
    for (const code of p.additives) {
      const key = code.toUpperCase();
      const risk = ADDITIVE_RISK[key] ?? 2; // unbekannt → vorsichtig als umstritten werten
      additivePenalty -= risk === 3 ? 8 : risk === 2 ? 4 : 1;
      if (risk >= 2) risky.push(ADDITIVE_NAMES[key] ? `${key} · ${ADDITIVE_NAMES[key]}` : key);
    }
    additivePenalty = Math.max(additivePenalty, -30);
    factors.push({
      id: "additives",
      label: "Zusatzstoffe",
      value: `${p.additives.length} enthalten`,
      points: additivePenalty,
      status: additivePenalty <= -12 ? "bad" : additivePenalty <= -4 ? "medium" : "good",
      pct: clamp(100 + additivePenalty * 3),
      note: risky.length > 0 ? risky.slice(0, 4).join(" · ") : "Nur unbedenkliche Zusatzstoffe.",
    });
  }

  // --- Verarbeitungsgrad (NOVA) ---
  let novaPenalty = 0;
  if (p.novaGroup != null) {
    novaPenalty = p.novaGroup >= 4 ? -10 : p.novaGroup === 3 ? -4 : 0;
    factors.push({
      id: "nova",
      label: "Verarbeitungsgrad",
      value: `NOVA-Gruppe ${p.novaGroup}`,
      points: novaPenalty,
      status: p.novaGroup >= 4 ? "bad" : p.novaGroup === 3 ? "medium" : "good",
      pct: clamp(100 - (p.novaGroup - 1) * 30),
      note:
        p.novaGroup >= 4
          ? "Hochverarbeitetes Lebensmittel (UPF)."
          : p.novaGroup === 1
            ? "Unverarbeitet oder minimal verarbeitet."
            : undefined,
    });
  }

  return { score: clamp(base + additivePenalty + novaPenalty), factors };
}
