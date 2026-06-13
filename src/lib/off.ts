import { COUNTRY_LOOKUP, OFF_CATEGORY_MAP } from "./scoring/data";
import type { Nutriments, ProductData } from "./types";

// ============================================================
// OpenFoodFacts-Client.
// Strategie: eigene DB zuerst (productService), OFF als Fallback —
// Treffer werden in die eigene DB zurückgeschrieben (write-through).
// ============================================================

const BASE = "https://world.openfoodfacts.org";

const FIELDS = [
  "code", "product_name", "product_name_de", "brands", "quantity",
  "categories_tags", "image_front_url", "image_url",
  "ingredients_text_de", "ingredients_text", "ingredients",
  "nutriments", "additives_tags", "allergens_tags", "labels_tags",
  "origins_tags", "manufacturing_places", "packaging_tags",
  "nova_group", "nutriscore_grade", "ecoscore_score", "ecoscore_grade",
  "environmental_score_score", "stores", "ingredients_analysis_tags",
].join(",");

function userAgent(): string {
  const contact = process.env.OFF_CONTACT || "kontakt@truelabel.example";
  return `TrueLabel/0.1 (${contact})`;
}

/* eslint-disable @typescript-eslint/no-explicit-any */

function num(v: unknown): number | undefined {
  const n = typeof v === "string" ? parseFloat(v) : (v as number);
  return typeof n === "number" && Number.isFinite(n) ? n : undefined;
}

function stripLang(tag: string): string {
  const i = tag.indexOf(":");
  return i >= 0 ? tag.slice(i + 1) : tag;
}

// Unser Feld -> OFF-Schlüssel (jeweils der _100g-Wert).
const NUTRI_KEYS: [keyof Nutriments, string][] = [
  ["energyKj", "energy-kj_100g"],
  ["fat", "fat_100g"], ["satFat", "saturated-fat_100g"], ["monoFat", "monounsaturated-fat_100g"],
  ["polyFat", "polyunsaturated-fat_100g"], ["transFat", "trans-fat_100g"],
  ["omega3", "omega-3-fat_100g"], ["omega6", "omega-6-fat_100g"], ["cholesterol", "cholesterol_100g"],
  ["carbs", "carbohydrates_100g"], ["sugars", "sugars_100g"], ["addedSugars", "added-sugars_100g"],
  ["starch", "starch_100g"], ["polyols", "polyols_100g"], ["fiber", "fiber_100g"],
  ["protein", "proteins_100g"], ["salt", "salt_100g"], ["sodium", "sodium_100g"],
  ["alcohol", "alcohol_100g"], ["caffeine", "caffeine_100g"],
  ["vitaminA", "vitamin-a_100g"], ["vitaminC", "vitamin-c_100g"], ["vitaminD", "vitamin-d_100g"],
  ["vitaminE", "vitamin-e_100g"], ["vitaminK", "vitamin-k_100g"],
  ["vitaminB1", "vitamin-b1_100g"], ["vitaminB2", "vitamin-b2_100g"], ["vitaminB3", "vitamin-pp_100g"],
  ["vitaminB6", "vitamin-b6_100g"], ["vitaminB9", "vitamin-b9_100g"], ["vitaminB12", "vitamin-b12_100g"],
  ["calcium", "calcium_100g"], ["iron", "iron_100g"], ["magnesium", "magnesium_100g"],
  ["zinc", "zinc_100g"], ["potassium", "potassium_100g"], ["phosphorus", "phosphorus_100g"],
  ["copper", "copper_100g"], ["manganese", "manganese_100g"], ["selenium", "selenium_100g"], ["iodine", "iodine_100g"],
];

function mapNutriments(n: any): Nutriments {
  if (!n) return {};
  const out: Nutriments = {};
  out.energyKcal =
    num(n["energy-kcal_100g"]) ??
    (num(n["energy_100g"]) != null ? Math.round(num(n["energy_100g"])! / 4.184) : undefined);
  for (const [k, offk] of NUTRI_KEYS) {
    const v = num(n[offk]);
    if (v != null) out[k] = v;
  }
  if (out.vitaminB9 == null) out.vitaminB9 = num(n["folates_100g"]) ?? num(n["folate_100g"]);
  out.fruitsVegPct = num(n["fruits-vegetables-nuts-estimate-from-ingredients_100g"]);
  return out;
}

function mapCategory(tags: string[]): string {
  // OFF sortiert breit → spezifisch; wir suchen von hinten (spezifischste zuerst).
  for (const tag of [...tags].reverse()) {
    const hit = OFF_CATEGORY_MAP.find(([offTag]) => offTag === tag);
    if (hit) return hit[1];
  }
  for (const tag of [...tags].reverse()) {
    const hit = OFF_CATEGORY_MAP.find(([offTag]) => tag.includes(stripLang(offTag)));
    if (hit) return hit[1];
  }
  return "other";
}

function mapOrigin(raw: any): string {
  const origins: string[] = raw.origins_tags ?? [];
  for (const tag of origins) {
    const key = stripLang(tag).toLowerCase();
    if (COUNTRY_LOOKUP[key]) return COUNTRY_LOOKUP[key];
  }
  const places = String(raw.manufacturing_places ?? "").toLowerCase();
  for (const [name, iso] of Object.entries(COUNTRY_LOOKUP)) {
    if (places.includes(name.replace(/-/g, " "))) return iso;
  }
  return "unknown";
}

function mapPackaging(tags: string[]): string[] {
  const out = new Set<string>();
  for (const t of tags) {
    const k = stripLang(t).toLowerCase();
    if (/(cardboard|paper|karton)/.test(k)) out.add("cardboard");
    else if (/(glass|glas)/.test(k)) out.add("glass");
    else if (/(aluminium|metal|tin|can|steel|dose)/.test(k)) out.add("metal");
    else if (/(tetra|composite|brick|verbund)/.test(k)) out.add("composite");
    else if (/(plastic|kunststoff|pet|pp-|pe-)/.test(k)) out.add("plastic");
  }
  return [...out];
}

function mapLabels(tags: string[]): string[] {
  const out = new Set<string>();
  for (const t of tags) {
    const k = stripLang(t).toLowerCase();
    if (/(^|-)organic|eu-bio|bio-siegel/.test(k)) out.add("organic");
    if (/fair-?trade|max-havelaar/.test(k)) out.add("fairtrade");
    if (/rainforest|utz/.test(k)) out.add("rainforest");
    if (/rspo|sustainable-palm/.test(k)) out.add("rspo");
    if (/gluten-?free|no-gluten|glutenfrei/.test(k)) out.add("gluten-free");
  }
  return [...out];
}

function mapAnalysis(tags: string[]): string[] {
  const keep = ["vegan", "non-vegan", "vegetarian", "non-vegetarian", "palm-oil", "palm-oil-free"];
  const out = new Set<string>();
  for (const t of tags) {
    const k = stripLang(t).toLowerCase();
    if (keep.includes(k)) out.add(k);
  }
  return [...out];
}

export function mapOffProduct(raw: any): ProductData {
  const categoriesTags: string[] = raw.categories_tags ?? [];
  const ecoScore = num(raw.ecoscore_score) ?? num(raw.environmental_score_score);
  const grade = String(raw.nutriscore_grade ?? "").toLowerCase();
  return {
    barcode: String(raw.code),
    name: raw.product_name_de || raw.product_name || "Unbekanntes Produkt",
    brand: (raw.brands || "").split(",")[0].trim(),
    quantity: raw.quantity || "",
    category: mapCategory(categoriesTags),
    imageUrl: raw.image_front_url || raw.image_url || undefined,
    ingredientsText: raw.ingredients_text_de || raw.ingredients_text || undefined,
    ingredients: Array.isArray(raw.ingredients)
      ? raw.ingredients.slice(0, 24).map((i: any) => ({
          name: String(i.text ?? i.id ?? "").replace(/^[a-z]{2}:/, ""),
          percent: num(i.percent_estimate) != null ? Math.round(num(i.percent_estimate)!) : undefined,
        }))
      : [],
    nutriments: mapNutriments(raw.nutriments),
    additives: (raw.additives_tags ?? []).map((t: string) => stripLang(t).toUpperCase()),
    allergens: (raw.allergens_tags ?? []).map((t: string) => stripLang(t).toLowerCase()),
    labels: mapLabels(raw.labels_tags ?? []),
    analysisTags: mapAnalysis(raw.ingredients_analysis_tags ?? []),
    originCountry: mapOrigin(raw),
    packaging: mapPackaging(raw.packaging_tags ?? []),
    novaGroup: num(raw.nova_group),
    nutriscoreGrade: ["a", "b", "c", "d", "e"].includes(grade) ? grade : undefined,
    offEcoScore: ecoScore != null ? Math.round(ecoScore) : undefined,
    stores: raw.stores ? String(raw.stores).split(",").map((s: string) => s.trim()).filter(Boolean) : undefined,
  };
}

export async function fetchOffProduct(barcode: string): Promise<ProductData | null> {
  const url = `${BASE}/api/v2/product/${encodeURIComponent(barcode)}.json?fields=${FIELDS}&lc=de`;
  const res = await fetch(url, {
    headers: { "User-Agent": userAgent() },
    signal: AbortSignal.timeout(8000),
    cache: "no-store",
  });
  if (!res.ok) return null;
  const json: any = await res.json();
  if (json.status !== 1 || !json.product) return null;
  return mapOffProduct(json.product);
}

export async function searchOffProducts(query: string, limit = 8): Promise<ProductData[]> {
  const url =
    `${BASE}/cgi/search.pl?search_terms=${encodeURIComponent(query)}` +
    `&search_simple=1&action=process&json=1&page_size=${limit}&fields=${FIELDS}&lc=de&cc=de`;
  const res = await fetch(url, {
    headers: { "User-Agent": userAgent() },
    // Kürzeres Timeout: OFF ist nur der Fallback, wenn die eigene DB zu
    // wenige Treffer hat — die Suche darf darauf nicht lange hängen.
    signal: AbortSignal.timeout(5000),
    cache: "no-store",
  });
  if (!res.ok) return [];
  const json: any = await res.json();
  const products: any[] = json.products ?? [];
  return products.filter((p) => p.code && (p.product_name || p.product_name_de)).map(mapOffProduct);
}
