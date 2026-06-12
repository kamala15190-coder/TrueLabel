import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";
import { createSessionToken, SESSION_COOKIE, sessionCookieOptions } from "@/lib/auth";
import { consumeResetToken, userIdForResetToken } from "@/lib/repo/passwordReset";
import { setPassword, toSessionUser, userById } from "@/lib/repo/users";

const schema = z.object({
  token: z.string().min(1),
  password: z.string().min(8, "Das Passwort braucht mindestens 8 Zeichen."),
});

export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe." },
      { status: 400 }
    );
  }

  const userId = await userIdForResetToken(parsed.data.token);
  if (!userId) {
    return NextResponse.json(
      { error: "Der Link ist ungültig oder abgelaufen. Fordere einen neuen an." },
      { status: 400 }
    );
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);
  await setPassword(userId, passwordHash);
  await consumeResetToken(parsed.data.token);

  // Direkt anmelden — der Nutzer hat seine Identität per Mail bewiesen.
  const row = await userById(userId);
  if (!row) return NextResponse.json({ ok: true });

  const token = await createSessionToken(row.id);
  const res = NextResponse.json({ user: toSessionUser(row) });
  res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions());
  return res;
}
