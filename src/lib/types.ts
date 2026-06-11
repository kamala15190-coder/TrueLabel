// ============================================================
// TrueLabel — zentrale Typen
// ============================================================

export interface Nutriments {
  energyKcal?: number;
  fat?: number;
  satFat?: number;
  carbs?: number;
  sugars?: number;
  protein?: number;
  salt?: number;
  fiber?: number;
  /** Obst/Gemüse/Nüsse-Anteil in % (Nutri-Score-Komponente) */
  fruitsVegPct?: number;
}

export type FactorStatus = "good" | "medium" | "bad" | "info";

/** Ein einzelner, erklärbarer Bewertungsfaktor. */
export interface Factor {
  id: string;
  label: string;
  /** Anzeigewert, z. B. "1,2 g/100 g" oder "EU-Bio" */
  value: string;
  /** Angewendetes Punkte-Delta auf der 0–100-Skala (0 = informativ) */
  points: number;
  status: FactorStatus;
  /** Füllgrad des Balkens in der UI (0–100) */
  pct: number;
  note?: string;
}

export interface DimensionScore {
  score: number; // 0–100
  factors: Factor[];
}

export interface Scores {
  version: number;
  total: number;
  health: DimensionScore;
  eco: DimensionScore;
  social: DimensionScore;
}

/** Normalisierte Produktdaten — Quelle: Seed, OpenFoodFacts oder Community. */
export interface ProductData {
  barcode: string;
  name: string;
  brand: string;
  quantity: string;
  /** normalisierter Kategorie-Key, z. B. "cereals" */
  category: string;
  imageUrl?: string;
  ingredientsText?: string;
  ingredients: { name: string; percent?: number }[];
  nutriments: Nutriments;
  /** ["E330", ...] */
  additives: string[];
  /** normalisierte Allergen-Keys: "gluten", "milk", "nuts", "peanuts", "soybeans", "eggs", ... */
  allergens: string[];
  /** ["organic", "fairtrade", "rainforest", "rspo", "gluten-free", ...] */
  labels: string[];
  /** ["vegan","vegetarian","palm-oil","palm-oil-free", ...] */
  analysisTags: string[];
  /** ISO-Kürzel klein ("de", "it") oder "unknown" */
  originCountry?: string;
  /** ["cardboard","plastic","glass","metal","composite"] */
  packaging: string[];
  novaGroup?: number;
  nutriscoreGrade?: string; // "a".."e"
  /** Eco-Score/Green-Score von OFF, falls vorhanden (0–100) */
  offEcoScore?: number;
  stores?: string[];
}

export interface Product extends ProductData {
  scores: Scores;
  source: "seed" | "off" | "community";
  verified: boolean;
}

export interface DietPrefs {
  vegan?: boolean;
  vegetarisch?: boolean;
  glutenfrei?: boolean;
  laktosefrei?: boolean;
  nussfrei?: boolean;
  sojafrei?: boolean;
  palmoelfrei?: boolean;
  zuckerarm?: boolean;
  bio?: boolean;
  fairtrade?: boolean;
}

export const DIET_PREF_LABELS: Record<keyof DietPrefs, string> = {
  vegan: "Vegan",
  vegetarisch: "Vegetarisch",
  glutenfrei: "Glutenfrei",
  laktosefrei: "Laktosefrei",
  nussfrei: "Nussfrei",
  sojafrei: "Sojafrei",
  palmoelfrei: "Palmölfrei",
  zuckerarm: "Zuckerarm",
  bio: "Bio bevorzugt",
  fairtrade: "Fairtrade bevorzugt",
};

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: "user" | "admin";
  points: number;
  premium: boolean;
  dietPrefs: DietPrefs;
}

export type PersonalLevel = "conflict" | "note" | "match";

export interface PersonalEntry {
  pref: keyof DietPrefs;
  level: PersonalLevel;
  label: string;
  detail: string;
}

export interface CorrectionVerdict {
  verdict: "accept" | "reject" | "manual";
  reason: string;
  suggestedValue?: string;
}

export interface ExtractedProduct {
  name?: string;
  brand?: string;
  quantity?: string;
  ingredientsText?: string;
  nutriments?: Nutriments;
  allergens?: string[];
}
