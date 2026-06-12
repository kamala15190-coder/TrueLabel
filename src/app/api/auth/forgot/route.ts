import { NextResponse } from "next/server";
import { z } from "zod";
import { mailLayout, sendMail } from "@/lib/mail";
import { createResetToken } from "@/lib/repo/passwordReset";
import { userByEmail } from "@/lib/repo/users";

const schema = z.object({ email: z.string().email() });

// Immer dieselbe Erfolgsantwort — keine Auskunft, ob die E-Mail existiert
// (verhindert Konto-Enumeration).
const ok = NextResponse.json({ ok: true });

export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return ok;

  const user = await userByEmail(parsed.data.email);
  if (!user) return ok;

  const token = await createResetToken(user.id);
  const base = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "";
  const link = `${base}/reset?token=${token}`;

  await sendMail({
    to: user.email,
    subject: "Passwort zurücksetzen bei TrueLabel",
    text: `Hallo${user.name ? " " + user.name : ""},\n\nsetze dein Passwort über diesen Link zurück (gültig für 1 Stunde):\n${link}\n\nWenn du das nicht angefordert hast, ignoriere diese Mail.`,
    html: mailLayout({
      heading: "Passwort zurücksetzen",
      body: `<p style="margin:0 0 16px">Hallo${user.name ? " " + user.name : ""}, du hast angefragt, dein Passwort zurückzusetzen. Der Link ist <b>1 Stunde</b> gültig.</p>`,
      cta: { label: "Neues Passwort festlegen", url: link },
    }),
  }).catch((err) => {
    console.error("[truelabel] Reset-Mail fehlgeschlagen:", err);
  });

  return ok;
}
