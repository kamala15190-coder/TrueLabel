// ============================================================
// TrueLabel — zentrale Typen
// ============================================================

export interface Nutriments {
  // Energie
  energyKcal?: number;
  energyKj?: number;
  // Fette (g/100 g)
  fat?: number;
  satFat?: number;
  monoFat?: number;
  polyFat?: number;
  transFat?: number;
  omega3?: number;
  omega6?: number;
  cholesterol?: number;
  // Kohlenhydrate (g/100 g)
  carbs?: number;
  sugars?: number;
  addedSugars?: number;
  starch?: number;
  polyols?: number;
  fiber?: number;
  // Protein & Salz (g/100 g)
  protein?: number;
  salt?: number;
  sodium?: number;
  // Sonstiges (g/100 g)
  alcohol?: number;
  caffeine?: number;
  // Vitamine (Werte wie von OFF, g/100 g)
  vitaminA?: number;
  vitaminC?: number;
  vitaminD?: number;
  vitaminE?: number;
  vitaminK?: number;
  vitaminB1?: number;
  vitaminB2?: number;
  vitaminB3?: number;
  vitaminB6?: number;
  vitaminB9?: number;
  vitaminB12?: number;
  // Mineralstoffe (g/100 g)
  calcium?: number;
  iron?: number;
  magnesium?: number;
  zinc?: number;
  potassium?: number;
  phosphorus?: number;
  copper?: number;
  manganese?: number;
  selenium?: number;
  iodine?: number;
  /** Obst/Gemüse/Nüsse-Anteil in % (Nutri-Score-Komponente) */
  fruitsVegPct?: number;
}

/** Anzeige-Reihenfolge + Labels + Einheiten-Typ der Nährwerte (für die UI). */
export const NUTRI_DISPLAY: { key: keyof Nutriments; label: string; kind: "kcal" | "macro" | "micro" }[] = [
  { key: "energyKcal", label: "Energie", kind: "kcal" },
  { key: "fat", label: "Fett", kind: "macro" },
  { key: "satFat", label: "davon gesättigte Fettsäuren", kind: "macro" },
  { key: "monoFat", label: "einfach ungesättigte Fettsäuren", kind: "macro" },
  { key: "polyFat", label: "mehrfach ungesättigte Fettsäuren", kind: "macro" },
  { key: "transFat", label: "Transfette", kind: "macro" },
  { key: "omega3", label: "Omega-3", kind: "macro" },
  { key: "omega6", label: "Omega-6", kind: "macro" },
  { key: "cholesterol", label: "Cholesterin", kind: "micro" },
  { key: "carbs", label: "Kohlenhydrate", kind: "macro" },
  { key: "sugars", label: "davon Zucker", kind: "macro" },
  { key: "addedSugars", label: "davon zugesetzter Zucker", kind: "macro" },
  { key: "polyols", label: "davon mehrwertige Alkohole", kind: "macro" },
  { key: "starch", label: "davon Stärke", kind: "macro" },
  { key: "fiber", label: "Ballaststoffe", kind: "macro" },
  { key: "protein", label: "Protein", kind: "macro" },
  { key: "salt", label: "Salz", kind: "macro" },
  { key: "sodium", label: "Natrium", kind: "micro" },
  { key: "alcohol", label: "Alkohol", kind: "macro" },
  { key: "caffeine", label: "Koffein", kind: "micro" },
  { key: "vitaminA", label: "Vitamin A", kind: "micro" },
  { key: "vitaminC", label: "Vitamin C", kind: "micro" },
  { key: "vitaminD", label: "Vitamin D", kind: "micro" },
  { key: "vitaminE", label: "Vitamin E", kind: "micro" },
  { key: "vitaminK", label: "Vitamin K", kind: "micro" },
  { key: "vitaminB1", label: "Vitamin B1 (Thiamin)", kind: "micro" },
  { key: "vitaminB2", label: "Vitamin B2 (Riboflavin)", kind: "micro" },
  { key: "vitaminB3", label: "Vitamin B3 (Niacin)", kind: "micro" },
  { key: "vitaminB6", label: "Vitamin B6", kind: "micro" },
  { key: "vitaminB9", label: "Vitamin B9 (Folsäure)", kind: "micro" },
  { key: "vitaminB12", label: "Vitamin B12", kind: "micro" },
  { key: "calcium", label: "Calcium", kind: "micro" },
  { key: "iron", label: "Eisen", kind: "micro" },
  { key: "magnesium", label: "Magnesium", kind: "micro" },
  { key: "zinc", label: "Zink", kind: "micro" },
  { key: "potassium", label: "Kalium", kind: "micro" },
  { key: "phosphorus", label: "Phosphor", kind: "micro" },
  { key: "copper", label: "Kupfer", kind: "micro" },
  { key: "manganese", label: "Mangan", kind: "micro" },
  { key: "selenium", label: "Selen", kind: "micro" },
  { key: "iodine", label: "Jod", kind: "micro" },
];

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
  /** Profilbild als Data-URL (clientseitig skaliert), sonst null. */
  avatar: string | null;
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
