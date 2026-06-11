import { fetchOffProduct } from "./off";
import { getProduct, upsertProduct } from "./repo/products";
import type { Product } from "./types";

/**
 * Datenstrategie: immer zuerst die eigene Datenbank.
 * Kein Treffer → OpenFoodFacts abfragen und das Ergebnis
 * write-through in die eigene DB schreiben. Der Nutzer merkt nichts.
 */
export async function getOrFetchProduct(barcode: string): Promise<Product | null> {
  const existing = await getProduct(barcode);
  if (existing) return existing;

  const off = await fetchOffProduct(barcode).catch(() => null);
  if (!off) return null;

  return upsertProduct(off, "off", false);
}
