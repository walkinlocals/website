import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { stripe } from "@/lib/stripe/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

/**
 * POST /api/webhooks/stripe
 *
 * The trusted callback Stripe hits after events happen. This is where state
 * that must NOT be trusted from the browser gets recorded:
 *
 *   - identity.verification_session.verified → profiles.id_verified = true
 *   - checkout.session.completed             → matches.status = 'Paid'
 *
 * We verify the Stripe signature against STRIPE_WEBHOOK_SECRET, then use the
 * service-role Supabase client (RLS-bypassing) to update the rows.
 *
 * Setup:
 *   Local:  stripe listen --forward-to localhost:3000/api/webhooks/stripe
 *           (copies a whsec_… into your terminal → put it in STRIPE_WEBHOOK_SECRET)
 *   Prod:   Add an endpoint in the Stripe dashboard for this URL and subscribe
 *           to the two event types above.
 */
export async function POST(request: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return NextResponse.json(
      { error: "STRIPE_WEBHOOK_SECRET is not configured." },
      { status: 500 },
    );
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature header." }, { status: 400 });
  }

  // Signature verification needs the raw, unparsed body.
  const rawBody = await request.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    return NextResponse.json(
      {
        error: `Signature verification failed: ${
          err instanceof Error ? err.message : "unknown error"
        }`,
      },
      { status: 400 },
    );
  }

  try {
    switch (event.type) {
      case "identity.verification_session.verified": {
        const session = event.data.object as Stripe.Identity.VerificationSession;
        const userId = session.metadata?.user_id;
        if (userId) {
          const { error } = await supabaseAdmin
            .from("profiles")
            .update({ id_verified: true })
            .eq("id", userId);
          if (error) throw new Error(`profiles update failed: ${error.message}`);
        }
        break;
      }

      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const matchId = session.metadata?.match_id;
        if (matchId) {
          const { error } = await supabaseAdmin
            .from("matches")
            .update({ status: "Paid" })
            .eq("id", matchId);
          if (error) throw new Error(`matches update failed: ${error.message}`);
        }
        break;
      }

      default:
        // Unhandled event types are acknowledged so Stripe stops retrying.
        break;
    }
  } catch (err) {
    // 500 tells Stripe to retry later.
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Webhook handler error." },
      { status: 500 },
    );
  }

  return NextResponse.json({ received: true });
}
