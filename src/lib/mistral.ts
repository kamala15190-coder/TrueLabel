import { q } from "./db";
import type { CorrectionVerdict, ExtractedProduct, ProductData } from "./types";
import { monthKey, sha256 } from "./util";

// ============================================================
// Mistral-Integration — radikal sparsam:
//  1. Harte Budgetbremse: monatliche Ausgaben werden in der DB
//     mitgezählt; ist das Limit erreicht, wird KEIN Call gemacht
//     (Features degradieren sauber in den manuellen Modus).
//  2. Cache: identische Anfragen treffen nie zweimal die API.
//  3. Regelbasiertes Scoring übernimmt alles, was ohne KI geht.
// ============================================================

const API_URL = "https://api.mistral.ai/v1/chat/completions";

// Preise in Cent pro 1M Tokens (konservativ gerundet)
const PRICES: Record<string, { input: number; output: number }> = {
  "pixtral-12b-latest": { input: 15, output: 15 },
  "mistral-small-latest": { input: 20, output: 60 },
};

const VISION_MODEL = "pixtral-12b-latest";
const TEXT_MODEL = "mistral-small-latest";

function budgetCents(): number {
  return Number(process.env.AI_BUDGET_CENTS ?? 3800);
}

export interface AiStatus {
  available: boolean;
  reason?: "no-key" | "budget";
  spentCents: number;
  budgetCents: number;
  calls: number;
}

export async function aiStatus(): Promise<AiStatus> {
  const limit = budgetCents();
  if (!process.env.MISTRAL_API_KEY) {
    return { available: false, reason: "no-key", spentCents: 0, budgetCents: limit, calls: 0 };
  }
  const rows = await q<{ spent_cents: number; calls: number }>(
    `SELECT spent_cents, calls FROM ai_budget WHERE month = $1`,
    [monthKey()]
  );
  const spent = Number(rows[0]?.spent_cents ?? 0);
  const calls = Number(rows[0]?.calls ?? 0);
  if (spent >= limit) {
    return { available: false, reason: "budget", spentCents: spent, budgetCents: limit, calls };
  }
  return { available: true, spentCents: spent, budgetCents: limit, calls };
}

async function addSpend(cents: number): Promise<void> {
  await q(
    `INSERT INTO ai_cache_noop_guard SELECT 1 WHERE false`, // no-op placeholder removed below
    []
  );
}

async function recordSpend(cents: number): Promise<void> {
  await q(
    `INSERT INTO ai_budget (month, spent_cents, calls) VALUES ($1, $2, 1)
     ON CONFLICT (month) DO UPDATE SET
       spent_cents = ai_budget.spent_cents + EXCLUDED.spent_cents,
       calls = ai_budget.calls + 1`,
    [monthKey(), cents]
  );
}

type ChatContent =
  | string
  | Array<{ type: "text"; text: string } | { type: "image_url"; image_url: string }>;

interface ChatMessage {
  role: "system" | "user";
  content: ChatContent;
}

async function chatJson(
  model: string,
  messages: ChatMessage[],
  maxTokens: number
): Promise<{ value: unknown; costCents: number } | null> {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.MISTRAL_API_KEY}`,
    },
    body: JSON.stringify({
      model,
      messages,
      response_format: { type: "json_object" },
      max_tokens: maxTokens,
      temperature: 0,
    }),
    signal: AbortSignal.timeout(45000),
  });
  if (!res.ok) {
    console.error("[mistral] API-Fehler", res.status, await res.text().catch(() => ""));
    return null;
  }
  const json = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
    usage?: { prompt_tokens?: number; completion_tokens?: number };
  };
  const content = json.choices?.[0]?.message?.content;
  if (!content) return null;
  const prices = PRICES[model] ?? { input: 50, output: 100 };
  const costCents =
    ((json.usage?.prompt_tokens ?? 2000) * prices.input +
      (json.usage?.completion_tokens ?? 500) * prices.output) /
    1_000_000;
  try {
    const cleaned = content.replace(/^```(?:json)?/m, "").replace(/```\s*$/m, "").trim();
    return { value: JSON.parse(cleaned), costCents };
  } catch {
    return null;
  }
}

/** Cache + Budget um einen KI-Call legen. */
async function cachedCall(
  kind: string,
  payloadKey: unknown,
  run: () => Promise<{ value: unknown; costCents: number } | null>
): Promise<unknown | null> {
  const key = sha256(`${kind}:${JSON.stringify(payloadKey)}`);
  const hit = await q<{ response: unknown }>(`SELECT response FROM ai_cache WHERE key = $1`, [key]);
  if (hit.length > 0) {
    const r = hit[0].response;
    return typeof r === "string" ? JSON.parse(r) : r;
  }
  const status = await aiStatus();
  if (!status.available) return null;

  const result = await run();
  if (!result) return null;

  await q(
    `INSERT INTO ai_cache (key, kind, response, cost_cents) VALUES ($1, $2, $3, $4)
     ON CONFLICT (key) DO NOTHING`,
    [key, kind, JSON.stringify(result.value), result.costCents]
  );
  await recordSpend(result.costCents);
  return result.value;
}

// ------------------------------------------------------------
// 1) Produktdaten aus Fotos extrahieren (Community-Beitrag)
// ------------------------------------------------------------

const EXTRACT_SYSTEM = `Du bist ein präziser Datenextraktor für Lebensmitteletiketten.
Du erhältst Fotos eines Produkts (Vorderseite, Zutatenliste/Nährwerte, ggf. Barcode).
Extrahiere ausschließlich, was lesbar ist. Erfinde NICHTS.
Antworte als JSON-Objekt mit genau diesen Feldern (fehlende Werte: null):
{
  "name": string|null,
  "brand": string|null,
  "quantity": string|null,
  "ingredientsText": string|null,
  "nutriments": {
    "energyKcal": number|null, "fat": number|null, "satFat": number|null,
    "carbs": number|null, "sugars": number|null, "protein": number|null,
    "salt": number|null, "fiber": number|null
  },
  "allergens": string[]
}
Nährwerte beziehen sich auf 100 g bzw. 100 ml. Allergene als deutsche Wörter (z. B. "gluten", "milch", "soja", "erdnüsse", "nüsse", "eier").`;

const ALLERGEN_MAP: Record<string, string> = {
  gluten: "gluten", weizen: "gluten", milch: "milk", laktose: "milk",
  soja: "soybeans", "erdnüsse": "peanuts", erdnuss: "peanuts",
  "nüsse": "nuts", haselnuss: "nuts", mandeln: "nuts", eier: "eggs", ei: "eggs",
  sellerie: "celery", senf: "mustard", sesam: "sesame", fisch: "fish",
  krebstiere: "crustaceans", lupinen: "lupin", sulfite: "sulphites",
};

export async function extractProduct(
  images: string[],
  barcode: string
): Promise<ExtractedProduct | null> {
  const value = await cachedCall(
    "extract",
    { barcode, images: images.map((i) => sha256(i)) },
    () =>
      chatJson(
        VISION_MODEL,
        [
          { role: "system", content: EXTRACT_SYSTEM },
          {
            role: "user",
            content: [
              { type: "text", text: `Produkt mit Barcode ${barcode}. Extrahiere die Daten aus den Fotos.` },
              ...images.map((url) => ({ type: "image_url" as const, image_url: url })),
            ],
          },
        ],
        900
      )
  );
  if (!value || typeof value !== "object") return null;
  const v = value as Record<string, unknown>;
  const n = (v.nutriments ?? {}) as Record<string, unknown>;
  const numOrU = (x: unknown) => (typeof x === "number" && Number.isFinite(x) ? x : undefined);
  const strOrU = (x: unknown) => (typeof x === "string" && x.trim() ? x.trim() : undefined);
  const allergens = Array.isArray(v.allergens)
    ? [...new Set(
        v.allergens
          .map((a) => ALLERGEN_MAP[String(a).toLowerCase().trim()] ?? null)
          .filter((a): a is string => a != null)
      )]
    : [];
  return {
    name: strOrU(v.name),
    brand: strOrU(v.brand),
    quantity: strOrU(v.quantity),
    ingredientsText: strOrU(v.ingredientsText),
    nutriments: {
      energyKcal: numOrU(n.energyKcal),
      fat: numOrU(n.fat),
      satFat: numOrU(n.satFat),
      carbs: numOrU(n.carbs),
      sugars: numOrU(n.sugars),
      protein: numOrU(n.protein),
      salt: numOrU(n.salt),
      fiber: numOrU(n.fiber),
    },
    allergens,
  };
}

// ------------------------------------------------------------
// 2) Korrektur-Triage: eindeutig korrekt → übernehmen,
//    eindeutig falsch → ablehnen, sonst → Admin-Queue.
// ------------------------------------------------------------

const REVIEW_SYSTEM = `Du prüfst Nutzer-Korrekturen für eine Lebensmitteldatenbank.
Du erhältst die aktuellen Produktdaten und einen Korrekturvorschlag.
Entscheide konservativ:
- "accept" NUR wenn die Korrektur offensichtlich plausibel und präzise ist
  (z. B. Tippfehler im Namen, eindeutig korrigierte Mengenangabe) UND du einen
  konkreten neuen Wert angeben kannst.
- "reject" NUR wenn die Korrektur offensichtlich falsch, Spam oder Unsinn ist.
- Sonst IMMER "manual" (menschliche Prüfung).
Antworte als JSON: {"verdict":"accept"|"reject"|"manual","reason":string,"suggestedValue":string|null}
"reason" ist eine kurze deutsche Begründung für den Nutzer.`;

export async function reviewCorrection(input: {
  product: ProductData;
  field: string;
  message: string;
}): Promise<CorrectionVerdict | null> {
  const slim = {
    name: input.product.name,
    brand: input.product.brand,
    quantity: input.product.quantity,
    ingredientsText: input.product.ingredientsText,
    nutriments: input.product.nutriments,
  };
  const value = await cachedCall(
    "review",
    { barcode: input.product.barcode, field: input.field, message: input.message },
    () =>
      chatJson(
        TEXT_MODEL,
        [
          { role: "system", content: REVIEW_SYSTEM },
          {
            role: "user",
            content: `Produktdaten: ${JSON.stringify(slim)}\n\nKorrektur betrifft Feld: ${input.field}\nNachricht des Nutzers: ${input.message}`,
          },
        ],
        400
      )
  );
  if (!value || typeof value !== "object") return null;
  const v = value as Record<string, unknown>;
  const verdict = String(v.verdict ?? "manual");
  return {
    verdict: verdict === "accept" || verdict === "reject" ? verdict : "manual",
    reason: String(v.reason ?? "Wird manuell geprüft."),
    suggestedValue:
      typeof v.suggestedValue === "string" && v.suggestedValue.trim()
        ? v.suggestedValue.trim()
        : undefined,
  };
}

export async function aiCacheStats(): Promise<{ entries: number }> {
  const rows = await q<{ n: string }>(`SELECT count(*)::text AS n FROM ai_cache`);
  return { entries: Number(rows[0]?.n ?? 0) };
}
