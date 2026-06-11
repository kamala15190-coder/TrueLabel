import type { DimensionScore, Factor, ProductData } from "../types";
import { clamp } from "../util";
import { CATEGORIES, COUNTRY_FLAGS, COUNTRY_NAMES } from "./data";

// ============================================================
// Umwelt-Score (0–100), Basis 50.
// Faktoren: Bio-Zertifizierung, Herkunft/Transportwege,
// Verpackung, Palmöl, CO₂-Schätzung der Kategorie.
// Liegt ein OFF-Green-Score vor, wird 50/50 gemischt.
// ============================================================

const DACH = ["de", "at", "ch"];
const EU = ["fr","it","es","pt","nl","be","lu","dk","se","fi","ie","pl","cz","sk","hu","si","hr","gr","ro","bg","ee","lv","lt","mt","cy","no","is","gb"];

const PACKAGING_SCORE: Record<string, number> = {
  cardboard: 6,
  glass: 3,
  metal: 1,
  plastic: -6,
  composite: -8,
};

const PACKAGING_LABEL: Record<string, string> = {
  cardboard: "Karton/Papier (recyclebar)",
  glass: "Glas",
  metal: "Metall/Dose",
  plastic: "Kunststoff",
  composite: "Verbundmaterial (schwer recyclebar)",
};

export function computeEco(p: ProductData): DimensionScore {
  const factors: Factor[] = [];
  let score = 50;

  // --- Bio ---
  const organic = p.labels.includes("organic");
  const bioPts = organic ? 12 : 0;
  score += bioPts;
  factors.push({
    id: "organic",
    label: "Bio-Zertifikat",
    value: organic ? "EU-Bio" : "Nicht zertifiziert",
    points: bioPts,
    status: organic ? "good" : "info",
    pct: organic ? 95 : 35,
    note: organic ? "Ökologische Erzeugung nach EU-Öko-Verordnung." : undefined,
  });

  // --- Herkunft ---
  const origin = p.originCountry ?? "unknown";
  let originPts: number;
  let originStatus: Factor["status"];
  let originNote: string | undefined;
  if (DACH.includes(origin)) {
    originPts = 10; originStatus = "good"; originNote = "Kurze Transportwege.";
  } else if (EU.includes(origin)) {
    originPts = 5; originStatus = "good"; originNote = "Europäische Herkunft.";
  } else if (origin === "unknown") {
    originPts = -3; originStatus = "medium"; originNote = "Herkunft nicht deklariert.";
  } else {
    originPts = -8; originStatus = "medium"; originNote = "Lange Transportwege (Übersee).";
  }
  score += originPts;
  factors.push({
    id: "origin",
    label: "Herkunftsland",
    value: `${COUNTRY_FLAGS[origin] ?? ""} ${COUNTRY_NAMES[origin] ?? origin}`.trim(),
    points: originPts,
    status: originStatus,
    pct: clamp(60 + originPts * 4),
    note: originNote,
  });

  // --- Verpackung ---
  if (p.packaging.length > 0) {
    // konservativ: das schlechteste Material dominiert
    const worst = p.packaging.reduce(
      (acc, m) => Math.min(acc, PACKAGING_SCORE[m] ?? 0),
      Infinity
    );
    const packPts = worst === Infinity ? 0 : worst;
    score += packPts;
    factors.push({
      id: "packaging",
      label: "Verpackung",
      value: p.packaging.map((m) => PACKAGING_LABEL[m] ?? m).join(", "),
      points: packPts,
      status: packPts > 0 ? "good" : packPts < 0 ? "medium" : "info",
      pct: clamp(60 + packPts * 5),
    });
  } else {
    factors.push({
      id: "packaging",
      label: "Verpackung",
      value: "Keine Angabe",
      points: 0,
      status: "info",
      pct: 40,
    });
  }

  // --- Palmöl ---
  if (p.analysisTags.includes("palm-oil")) {
    const rspo = p.labels.includes("rspo");
    const palmPts = rspo ? -4 : -10;
    score += palmPts;
    factors.push({
      id: "palm",
      label: "Palmöl",
      value: rspo ? "Enthalten (RSPO-zertifiziert)" : "Enthalten",
      points: palmPts,
      status: rspo ? "medium" : "bad",
      pct: rspo ? 45 : 20,
      note: "Palmölanbau ist ein Haupttreiber von Regenwaldabholzung.",
    });
  } else {
    factors.push({
      id: "palm",
      label: "Palmöl",
      value: "Nicht enthalten",
      points: 0,
      status: "good",
      pct: 100,
    });
  }

  // --- CO₂-Schätzung (Kategorie) ---
  const co2 = (CATEGORIES[p.category] ?? CATEGORIES.other).co2;
  const co2Pts = co2 < 1 ? 8 : co2 < 3 ? 4 : co2 < 8 ? 0 : co2 < 15 ? -8 : -15;
  score += co2Pts;
  factors.push({
    id: "co2",
    label: "CO₂-Schätzung",
    value: `~${co2.toLocaleString("de-DE")} kg CO₂e/kg`,
    points: co2Pts,
    status: co2Pts > 0 ? "good" : co2Pts === 0 ? "medium" : "bad",
    pct: clamp(70 + co2Pts * 4),
    note: "Durchschnittswert der Produktkategorie (Größenordnung Agribalyse).",
  });

  let final = clamp(score);

  // --- Green-Score (OFF) einmischen, falls vorhanden ---
  if (p.offEcoScore != null) {
    final = clamp(Math.round(0.5 * final + 0.5 * p.offEcoScore));
    factors.push({
      id: "off-eco",
      label: "Green-Score (OpenFoodFacts)",
      value: `${p.offEcoScore}/100`,
      points: 0,
      status: "info",
      pct: p.offEcoScore,
      note: "Lebenszyklus-Analyse von OpenFoodFacts, zu 50 % eingerechnet.",
    });
  }

  return { score: final, factors };
}
