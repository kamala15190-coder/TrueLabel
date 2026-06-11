import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/auth";
import { aiStatus, extractProduct } from "@/lib/mistral";

const schema = z.object({
  barcode: z.string().regex(/^\d{6,14}$/),
  // Data-URLs, clientseitig auf ~800px JPEG komprimiert
  images: z.array(z.string().startsWith("data:image/")).min(1).max(3),
});

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Ungültige Daten." }, { status: 400 });

  // Größenlimit: max ~1,5 MB pro Bild als Data-URL
  if (parsed.data.images.some((i) => i.length > 2_000_000)) {
    return NextResponse.json({ error: "Bilder zu groß." }, { status: 413 });
  }

  const status = await aiStatus();
  if (!status.available) {
    return NextResponse.json({ extracted: null, aiUsed: false, reason: status.reason });
  }

  const extracted = await extractProduct(parsed.data.images, parsed.data.barcode);
  return NextResponse.json({ extracted, aiUsed: extracted != null });
}
