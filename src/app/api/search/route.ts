import { NextResponse } from "next/server";
import { searchOffProducts } from "@/lib/off";
import { productsByCategory, searchProducts, upsertProduct } from "@/lib/repo/products";
import { CATEGORIES } from "@/lib/scoring/data";
import type { Product } from "@/lib/types";

export async function GET(req: Request) {
  const url = new URL(req.url);

  // Kategorie-Browsen (eigene DB)
  const cat = url.searchParams.get("cat");
  if (cat && CATEGORIES[cat]) {
    const products = await productsByCategory(cat, "", 16);
    return NextResponse.json({ products });
  }

  const query = (url.searchParams.get("q") ?? "").trim();
  if (query.length < 2) {
    return NextResponse.json({ products: [] });
  }

  // 1) Eigene Datenbank zuerst
  const own = await searchProducts(query, 12);

  // 2) Zu wenige Treffer? OpenFoodFacts dazu — und write-through speichern.
  let merged: Product[] = own;
  if (own.length < 4 && query.length >= 3) {
    const off = await searchOffProducts(query, 8).catch(() => []);
    const known = new Set(own.map((p) => p.barcode));
    for (const data of off) {
      if (known.has(data.barcode)) continue;
      try {
        const saved = await upsertProduct(data, "off", false);
        merged = [...merged, saved];
        known.add(data.barcode);
      } catch {
        // einzelner Fehler darf die Suche nicht abbrechen
      }
    }
  }

  return NextResponse.json({ products: merged.slice(0, 16) });
}
