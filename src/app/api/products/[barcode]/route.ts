import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { checkPersonal } from "@/lib/personal";
import { getOrFetchProduct } from "@/lib/productService";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ barcode: string }> }
) {
  const { barcode } = await params;
  if (!/^\d{6,14}$/.test(barcode)) {
    return NextResponse.json({ error: "Ungültiger Barcode." }, { status: 400 });
  }
  const product = await getOrFetchProduct(barcode);
  if (!product) {
    return NextResponse.json({ error: "Produkt nicht gefunden." }, { status: 404 });
  }
  const user = await getSessionUser();
  const personal = user ? checkPersonal(product, user.dietPrefs) : [];
  return NextResponse.json({ product, personal });
}
