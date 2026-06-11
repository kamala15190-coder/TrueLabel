import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { setPremiumUntil, setStripeCustomer, userByStripeCustomer } from "@/lib/repo/users";
import { getStripe, stripeEnabled } from "@/lib/stripe";

// ============================================================
// Stripe-Webhook. Raw-Body lesen (Signaturprüfung!).
// Perioden-Ende defensiv lesen: ältere API-Versionen haben
// current_period_end auf der Subscription, neuere (Basil) auf
// den Subscription-Items. +3 Tage Kulanz gegen Webhook-Lücken.
// ============================================================

function periodEnd(sub: Stripe.Subscription): Date | null {
  const anySub = sub as unknown as {
    current_period_end?: number;
    items?: { data?: { current_period_end?: number }[] };
  };
  let ts = anySub.current_period_end;
  if (!ts && anySub.items?.data?.length) {
    const max = Math.max(...anySub.items.data.map((i) => i.current_period_end ?? 0));
    ts = max > 0 ? max : undefined;
  }
  return ts ? new Date((ts + 3 * 86400) * 1000) : null;
}

async function applySubscription(sub: Stripe.Subscription): Promise<void> {
  const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
  const user = await userByStripeCustomer(customerId);
  if (!user) return;
  const active = sub.status === "active" || sub.status === "trialing" || sub.status === "past_due";
  await setPremiumUntil(user.id, active ? periodEnd(sub) : null);
}

export async function POST(req: Request) {
  if (!stripeEnabled() || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Nicht konfiguriert." }, { status: 503 });
  }
  const stripe = getStripe();
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");
  if (!signature) return NextResponse.json({ error: "Signatur fehlt." }, { status: 400 });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET);
  } catch {
    return NextResponse.json({ error: "Ungültige Signatur." }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const customerId =
          typeof session.customer === "string" ? session.customer : session.customer?.id;
        // Kundenzuordnung sicherstellen (falls Checkout ohne vorab angelegten Kunden lief)
        if (customerId && session.client_reference_id) {
          await setStripeCustomer(session.client_reference_id, customerId);
        }
        if (session.subscription) {
          const subId =
            typeof session.subscription === "string"
              ? session.subscription
              : session.subscription.id;
          const sub = await stripe.subscriptions.retrieve(subId);
          await applySubscription(sub);
        }
        break;
      }
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        await applySubscription(event.data.object as Stripe.Subscription);
        break;
      }
      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice;
        const subRef = (invoice as unknown as { subscription?: string | { id: string } }).subscription;
        if (subRef) {
          const subId = typeof subRef === "string" ? subRef : subRef.id;
          const sub = await stripe.subscriptions.retrieve(subId);
          await applySubscription(sub);
        }
        break;
      }
    }
  } catch (err) {
    console.error("[stripe-webhook] Verarbeitungsfehler", err);
    return NextResponse.json({ error: "Verarbeitungsfehler." }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
