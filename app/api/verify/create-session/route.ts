import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe/server";

/**
 * POST /api/verify/create-session
 *
 * Creates a REAL Stripe Identity verification session (document + liveness
 * selfie), stores its id on the user's profile, and returns the hosted
 * verification URL for the client to redirect to.
 *
 * Note on the API shape: Stripe Identity does not take `{ document: true,
 * selfie: true }`. The selfie/liveness check is enabled via
 * `options.document.require_matching_selfie`. This is the correct, working
 * shape.
 *
 * Requires: Stripe Identity enabled on your account
 * (https://dashboard.stripe.com/identity). In test mode you can complete the
 * flow with Stripe's test documents.
 */
export async function POST() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  let verificationUrl: string | null;
  let sessionId: string;

  try {
    const session = await stripe.identity.verificationSessions.create({
      type: "document",
      options: {
        document: {
          // Liveness selfie matched against the ID photo.
          require_matching_selfie: true,
          require_live_capture: true,
          allowed_types: ["passport", "driving_license", "id_card"],
        },
      },
      metadata: { user_id: user.id },
      return_url: `${appUrl}/profile?verification=complete`,
    });

    verificationUrl = session.url;
    sessionId = session.id;
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "Could not start identity verification.",
      },
      { status: 502 },
    );
  }

  if (!verificationUrl) {
    return NextResponse.json(
      { error: "Stripe did not return a verification URL." },
      { status: 502 },
    );
  }

  // Persist the session id so a webhook (identity.verification_session.verified)
  // can later flip profiles.id_verified = true for this user.
  const { error: updateError } = await supabase
    .from("profiles")
    .update({ stripe_verification_session_id: sessionId })
    .eq("id", user.id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ url: verificationUrl });
}
