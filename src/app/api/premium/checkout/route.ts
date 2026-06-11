import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/auth";
import { setStripeCustomer, userById } from "@/lib/repo/users";
import { appUrl, getStripe, stripeEnabled } from "@/lib/stripe";

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });

  if (!stripeEnabled()) {
    return NextResponse.json(
      { error: "Zahlungen sind noch nicht eingerichtet. Bitte später erneut versuchen." },
      { status: 503 }
    );
  }

  const parsed = z
    .object({ plan: z.enum(["monthly", "yearly"]) })
    .safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Ungültiger Plan." }, { status: 400 });

  const priceId =
    parsed.data.plan === "yearly" && process.env.STRIPE_PRICE_YEARLY
      ? process.env.STRIPE_PRICE_YEARLY
      : process.env.STRIPE_PRICE_MONTHLY!;

  const stripe = getStripe();
  const row = await userById(user.id);
  let customerId = row?.stripe_customer_id ?? null;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: { truelabelUserId: user.id },
    });
    customerId = customer.id;
    await setStripeCustomer(user.id, customerId);
  }

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    client_reference_id: user.id,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${appUrl()}/premium/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appUrl()}/premium`,
    locale: "de",
    allow_promotion_codes: true,
    subscription_data: { description: "TrueLabel Premium" },
    custom_text: {
      submit: {
        message:
          "Jederzeit kündbar. Keine versteckten Kosten. Danke, dass du TrueLabel möglich machst.",
      },
    },
  });

  return NextResponse.json({ url: session.url });
}
