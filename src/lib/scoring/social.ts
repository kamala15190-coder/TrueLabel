import type { DimensionScore, Factor, ProductData } from "../types";
import { clamp } from "../util";
import { COUNTRY_FLAGS, COUNTRY_NAMES, RISK_INGREDIENTS, countryTier } from "./data";

// ============================================================
// Sozial-Score (0–100), Basis 55.
// Faktoren: Fairtrade-/Nachhaltigkeitssiegel, Risikorohstoffe
// (Kinderarbeit/Ausbeutung), Herkunftsland-Tier, Transparenz.
// ============================================================

export function computeSocial(p: ProductData): DimensionScore {
  const factors: Factor[] = [];
  let score = 55;

  // --- Siegel ---
  const fairtrade = p.labels.includes("fairtrade");
  const rainforest = p.labels.includes("rainforest");
  const labelPts = Math.min((fairtrade ? 18 : 0) + (rainforest ? 10 : 0), 20);
  score += labelPts;
  factors.push({
    id: "fairtrade",
    label: "Fairtrade-Siegel",
    value: fairtrade
      ? "Fairtrade-zertifiziert"
      : rainforest
        ? "Rainforest Alliance"
        : "Nicht vorhanden",
    points: labelPts,
    status: labelPts > 0 ? "good" : "medium",
    pct: labelPts > 0 ? 90 : 30,
    note:
      labelPts > 0
        ? "Unabhängig zertifizierte Lieferkette."
        : "Eine Zertifizierung würde den Sozial-Score verbessern.",
  });

  // --- Risikorohstoffe ---
  const haystack = [
    p.ingredientsText ?? "",
    ...p.ingredients.map((i) => i.name),
    p.name,
  ].join(" ");
  const found = RISK_INGREDIENTS.filter((r) => r.pattern.test(haystack));
  if (found.length === 0) {
    score += 5;
    factors.push({
      id: "risk",
      label: "Risikorohstoffe",
      value: "Keine enthalten",
      points: 5,
      status: "good",
      pct: 100,
      note: "Kein Kakao, Kaffee, Vanille oder andere Hochrisiko-Rohstoffe.",
    });
  } else if (fairtrade || rainforest) {
    factors.push({
      id: "risk",
      label: "Risikorohstoffe",
      value: found.map((f) => f.label).join(", "),
      points: 0,
      status: "good",
      pct: 80,
      note: "Risiko durch zertifizierte Lieferkette abgedeckt.",
    });
  } else {
    const penalty = Math.max(found.reduce((acc, f) => acc + f.penalty, 0), -25);
    score += penalty;
    factors.push({
      id: "risk",
      label: "Risikorohstoffe",
      value: found.map((f) => f.label).join(", "),
      points: penalty,
      status: penalty <= -12 ? "bad" : "medium",
      pct: clamp(70 + penalty * 3),
      note: "Rohstoffe mit dokumentiertem Risiko für Ausbeutung in der Lieferkette, ohne unabhängige Zertifizierung.",
    });
  }

  // --- Herkunftsland (Arbeitsrechte) ---
  const origin = p.originCountry ?? "unknown";
  const tier = countryTier(origin);
  const tierPts = tier === 1 ? 10 : tier === 2 ? 5 : tier === 3 ? -5 : tier === 4 ? -12 : -3;
  score += tierPts;
  factors.push({
    id: "origin",
    label: "Herstellerland",
    value: `${COUNTRY_FLAGS[origin] ?? ""} ${COUNTRY_NAMES[origin] ?? origin}`.trim(),
    points: tierPts,
    status: tier === 1 || tier === 2 ? "good" : tier === 0 ? "medium" : "bad",
    pct: clamp(60 + tierPts * 3),
    note:
      tier === 0
        ? "Keine Herkunftsangabe. Transparenz eingeschränkt."
        : tier >= 3
          ? "Erhöhtes Risiko bei Arbeitsrechten (ITUC-Einstufung der Region)."
          : "Starke Arbeitsrechte und Kontrollen.",
  });

  // --- Transparenz ---
  const transparent = origin !== "unknown" || p.labels.length > 0;
  if (!transparent) {
    score -= 4;
    factors.push({
      id: "transparency",
      label: "Unternehmenstransparenz",
      value: "Gering",
      points: -4,
      status: "medium",
      pct: 30,
      note: "Weder Herkunft noch Zertifizierungen deklariert.",
    });
  } else {
    factors.push({
      id: "transparency",
      label: "Unternehmenstransparenz",
      value: p.labels.length > 0 ? "Gut" : "Mittel",
      points: 0,
      status: p.labels.length > 0 ? "good" : "medium",
      pct: p.labels.length > 0 ? 80 : 55,
    });
  }

  return { score: clamp(score), factors };
}
