import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { stripe, MATCH_FEE_CENTS } from "@/lib/stripe/server";

// 75% of the total goes to the host, 25% to the platform.
const HOST_SHARE = 0.75;

export async function POST(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  let matchId: unknown;
  let clientPartySize: unknown;
  try {
    const body = await request.json();
    matchId = body.matchId;
    clientPartySize = body.partySize; // Capture partySize if passed by the accepting guest
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (typeof matchId !== "string" || !matchId) {
    return NextResponse.json({ error: "matchId is required." }, { status: 400 });
  }

  // Fetch match details, including our new initiator_id tracker
  const { data: match } = await supabase
    .from("matches")
    .select("id, host_id, guest_id, status, party_size, initiator_id")
    .eq("id", matchId)
    .single();

  if (!match) return NextResponse.json({ error: "Match not found." }, { status: 404 });

  if (match.status !== "Pending" && match.status !== "Hold") {
    return NextResponse.json({ error: `This request is already '${match.status}'.` }, { status: 409 });
  }

  // ---------------------------------------------------------------------------
  // DYNAMIC DECISION RIGHTS CALCULATIONS
  // ---------------------------------------------------------------------------
  const hostInitiated = match.initiator_id === match.host_id;

  // Verify permission based on who started it
  const isHostDecider = !hostInitiated && user.id === match.host_id;
  const isGuestDecider = hostInitiated && user.id === match.guest_id;

  if (!isHostDecider && !isGuestDecider) {
    return NextResponse.json(
      { error: "You do not have permission to accept this connection request." },
      { status: 403 }
    );
  }

  // ---------------------------------------------------------------------------
  // PROFILE STATE CHECK
  // ---------------------------------------------------------------------------
  // The decider user must be fully active (complete + verified).
  const { data: deciderProfile } = await supabase
    .from("profiles")
    .select("is_active")
    .eq("id", user.id)
    .single();

  if (!deciderProfile?.is_active) {
    return NextResponse.json({ error: "Complete and verify your profile first." }, { status: 403 });
  }

  // ---------------------------------------------------------------------------
  // DYNAMIC PARTY SIZE RESOLUTION
  // ---------------------------------------------------------------------------
  let resolvedPartySize = match.party_size ?? 1;

  // If the guest is accepting, use their selected party size from the select input
  if (isGuestDecider && typeof clientPartySize === "number") {
    resolvedPartySize = clientPartySize;
  }

  // Double check bounds (between 1 and 5)
  const partySize = Math.min(Math.max(resolvedPartySize, 1), 5);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  // ---------------------------------------------------------------------------
  // STRIPE CHECKOUT INITIATION
  // ---------------------------------------------------------------------------
  let checkoutUrl: string | null;
  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "eur",
            unit_amount: MATCH_FEE_CENTS,
            product_data: {
              name: "Walk In — Connection Fee",
              description: "€35 per person. Unlocks contact details and chat with your host.",
            },
          },
          quantity: partySize,
        },
      ],
      success_url: `${appUrl}/matches?success=true&match=${match.id}`,
      cancel_url: `${appUrl}/matches`,
      metadata: {
        match_id: match.id,
        guest_id: match.guest_id,
        host_id: match.host_id,
        party_size: String(partySize),
        total_cents: String(MATCH_FEE_CENTS * partySize),
        host_share_cents: String(Math.round(MATCH_FEE_CENTS * partySize * HOST_SHARE)),
        platform_share_cents: String(
          MATCH_FEE_CENTS * partySize - Math.round(MATCH_FEE_CENTS * partySize * HOST_SHARE),
        ),
      },
    });
    checkoutUrl = session.url;
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not create Stripe checkout session." },
      { status: 502 },
    );
  }

  if (!checkoutUrl) {
    return NextResponse.json({ error: "Stripe did not return a checkout URL." }, { status: 502 });
  }

  // ---------------------------------------------------------------------------
  // PERSIST STATE & CHECKOUT URL
  // ---------------------------------------------------------------------------
  const { error: updateError } = await supabase
    .from("matches")
    .update({
      status: "Accepted",
      stripe_link: checkoutUrl,
      party_size: partySize // Update table state with confirmed guest count
    })
    .eq("id", match.id);

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

  return NextResponse.json({ status: "Accepted", stripe_link: checkoutUrl });
}