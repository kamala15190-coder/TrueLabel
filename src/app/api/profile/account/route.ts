import { NextResponse } from "next/server";
import { z } from "zod";
import { readSessionUserId } from "@/lib/auth";
import { updateAccount } from "@/lib/repo/users";

// Profilbild kommt clientseitig skaliert als Data-URL (JPEG ~256px). Großzügig
// gedeckelt (~190 KB Base64), damit niemand die DB mit Riesenbildern flutet.
const MAX_AVATAR_CHARS = 256_000;

const schema = z.object({
  name: z.string().trim().min(1, "Bitte gib einen Namen ein.").max(60, "Der Name ist zu lang."),
  avatar: z
    .union([
      z.string().startsWith("data:image/", "Ungültiges Bildformat.").max(MAX_AVATAR_CHARS, "Das Bild ist zu groß."),
      z.null(),
    ])
    .optional(),
});

export async function POST(req: Request) {
  const userId = await readSessionUserId();
  if (!userId) return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe." },
      { status: 400 }
    );
  }

  await updateAccount(userId, { name: parsed.data.name, avatar: parsed.data.avatar });
  return NextResponse.json({ ok: true });
}
