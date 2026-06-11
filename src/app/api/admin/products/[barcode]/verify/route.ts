import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getProduct, setVerified } from "@/lib/repo/products";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ barcode: string }> }
) {
  const user = await getSessionUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Kein Zugriff." }, { status: 403 });
  }
  const { barcode } = await params;
  const product = await getProduct(barcode);
  if (!product) return NextResponse.json({ error: "Nicht gefunden." }, { status: 404 });
  await setVerified(barcode);
  return NextResponse.json({ ok: true });
}
