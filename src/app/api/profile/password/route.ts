import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";
import { readSessionUserId } from "@/lib/auth";
import { setPassword, userById } from "@/lib/repo/users";

const schema = z.object({
  currentPassword: z.string().optional(),
  newPassword: z.string().min(8, "Das neue Passwort braucht mindestens 8 Zeichen."),
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

  const row = await userById(userId);
  if (!row) return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });

  // Wer bereits ein Passwort hat, muss das aktuelle bestätigen.
  // Reine Google-Konten (noch kein Passwort) dürfen erstmalig eines setzen.
  if (row.password_hash) {
    const current = parsed.data.currentPassword ?? "";
    const ok = current ? await bcrypt.compare(current, row.password_hash) : false;
    if (!ok) {
      return NextResponse.json({ error: "Das aktuelle Passwort ist falsch." }, { status: 400 });
    }
  }

  const passwordHash = await bcrypt.hash(parsed.data.newPassword, 10);
  await setPassword(userId, passwordHash);
  return NextResponse.json({ ok: true, hadPassword: Boolean(row.password_hash) });
}
