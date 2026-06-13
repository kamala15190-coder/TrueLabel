import { NextResponse } from "next/server";
import { z } from "zod";
import { readSessionUserId, SESSION_COOKIE } from "@/lib/auth";
import { deleteUserCompletely, updateAccount, userById } from "@/lib/repo/users";
import { getStripe, stripeEnabled } from "@/lib/stripe";

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

// Konto vollständig löschen: alle personenbezogenen Daten (inkl. Profilbild)
// entfernen, ein eventuelles Stripe-Abo kündigen und die Session beenden.
// Der gemeinsame Produktkatalog bleibt erhalten.
export async function DELETE() {
  const userId = await readSessionUserId();
  if (!userId) return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });

  // Stripe-Kunde löschen (kündigt automatisch laufende Abos) — best effort,
  // damit ein Stripe-Ausfall die Konto-Löschung nicht blockiert.
  if (stripeEnabled()) {
    try {
      const row = await userById(userId);
      if (row?.stripe_customer_id) {
        await getStripe().customers.del(row.stripe_customer_id);
      }
    } catch (err) {
      console.error("[account-delete] Stripe-Kunde konnte nicht gelöscht werden", err);
    }
  }

  await deleteUserCompletely(userId);

  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
  return res;
}
