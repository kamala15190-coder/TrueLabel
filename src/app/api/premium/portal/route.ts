import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { userById } from "@/lib/repo/users";
import { appUrl, getStripe, stripeEnabled } from "@/lib/stripe";

export async function POST() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });
  if (!stripeEnabled()) {
    return NextResponse.json({ error: "Zahlungen sind noch nicht eingerichtet." }, { status: 503 });
  }
  const row = await userById(user.id);
  if (!row?.stripe_customer_id) {
    return NextResponse.json({ error: "Kein aktives Abo gefunden." }, { status: 404 });
  }
  const session = await getStripe().billingPortal.sessions.create({
    customer: row.stripe_customer_id,
    return_url: `${appUrl()}/profile`,
  });
  return NextResponse.json({ url: session.url });
}
