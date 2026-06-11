import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/auth";
import { addContribution } from "@/lib/repo/community";
import { getProduct, upsertProduct } from "@/lib/repo/products";
import { addPoints } from "@/lib/repo/users";
import { CATEGORIES } from "@/lib/scoring/data";
import type { ProductData } from "@/lib/types";

const schema = z.object({
  barcode: z.string().regex(/^\d{6,14}$/),
  name: z.string().min(2).max(120),
  brand: z.string().max(80).default(""),
  quantity: z.string().max(40).default(""),
  category: z.string(),
  ingredientsText: z.string().max(3000).optional(),
  nutriments: z
    .object({
      energyKcal: z.number().nonnegative().optional(),
      fat: z.number().nonnegative().optional(),
      satFat: z.number().nonnegative().optional(),
      carbs: z.number().nonnegative().optional(),
      sugars: z.number().nonnegative().optional(),
      protein: z.number().nonnegative().optional(),
      salt: z.number().nonnegative().optional(),
      fiber: z.number().nonnegative().optional(),
    })
    .default({}),
  allergens: z.array(z.string()).max(14).default([]),
  originCountry: z.string().max(8).default("unknown"),
  packaging: z.enum(["cardboard", "glass", "plastic", "metal", "composite", "none"]).default("none"),
  organic: z.boolean().default(false),
  fairtrade: z.boolean().default(false),
});

/** E-Nummern aus der Zutatenliste erkennen (z. B. "E 330", "E150d"). */
function detectAdditives(text: string): string[] {
  const out = new Set<string>();
  const re = /\bE\s?(\d{3}[a-eA-E]?)\b/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) out.add(`E${m[1].toUpperCase()}`);
  return [...out];
}

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Bitte fülle die Pflichtfelder aus." }, { status: 400 });
  }
  const input = parsed.data;
  if (!CATEGORIES[input.category]) {
    return NextResponse.json({ error: "Unbekannte Kategorie." }, { status: 400 });
  }

  const isNew = (await getProduct(input.barcode)) == null;
  const text = input.ingredientsText ?? "";
  const labels = [
    ...(input.organic ? ["organic"] : []),
    ...(input.fairtrade ? ["fairtrade"] : []),
  ];
  const analysisTags = /palmöl|palmfett|palm oil/i.test(text) ? ["palm-oil"] : [];

  const data: ProductData = {
    barcode: input.barcode,
    name: input.name.trim(),
    brand: input.brand.trim(),
    quantity: input.quantity.trim(),
    category: input.category,
    ingredientsText: text || undefined,
    ingredients: text
      ? text
          .split(/[,;](?![^()]*\))/)
          .map((s) => s.replace(/\(.*?\)/g, "").replace(/\*+/g, "").trim())
          .filter((s) => s.length > 1)
          .slice(0, 24)
          .map((name) => ({ name }))
      : [],
    nutriments: input.nutriments,
    additives: detectAdditives(text),
    allergens: input.allergens,
    labels,
    analysisTags,
    originCountry: input.originCountry || "unknown",
    packaging: input.packaging === "none" ? [] : [input.packaging],
  };

  const product = await upsertProduct(data, "community", false);
  await addContribution(user.id, product.barcode);
  if (isNew) {
    await addPoints(user.id, 50, `Produkt beigetragen: ${product.barcode}`);
  }

  return NextResponse.json({ product, pointsAwarded: isNew ? 50 : 0 });
}
