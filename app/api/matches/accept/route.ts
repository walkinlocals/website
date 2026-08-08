import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  stripe,
  MATCH_FEE_CENTS,
  PLATFORM_FEE_CENTS,
  HOST_PAYOUT_CENTS,
  MAX_PARTY_SIZE,
} from "@/lib/stripe/server";
import { resolveViewerCanConnect } from "@/lib/viewer-profile";
import { Resend } from "resend";
import { hostPayoutsReady } from "@/lib/stripe-host-payouts";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  let matchId: unknown;
  let clientPartySize: unknown;
  try {
    const body = await request.json();
    matchId = body.matchId;
    clientPartySize = body.partySize;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (typeof matchId !== "string" || !matchId) {
    return NextResponse.json({ error: "matchId is required." }, { status: 400 });
  }

  const { data: match } = await supabase
    .from("matches")
    .select("id, host_id, guest_id, status, party_size, initiator_id, proposed_date, date_confirmed")
    .eq("id", matchId)
    .single();

  if (!match) return NextResponse.json({ error: "Match not found." }, { status: 404 });
  if (match.status !== "Pending" && match.status !== "Hold") {
    return NextResponse.json({ error: `This request is already '${match.status}'.` }, { status: 409 });
  }

  if (!match.proposed_date || !match.date_confirmed) {
    return NextResponse.json(
      {
        error: "Agree on a visit date before accepting this connection.",
        code: "DATE_NOT_CONFIRMED",
      },
      { status: 409 },
    );
  }

  const hostInitiated = match.initiator_id === match.host_id;
  const isHostDecider = !hostInitiated && user.id === match.host_id;
  const isGuestDecider = hostInitiated && user.id === match.guest_id;

  if (!isHostDecider && !isGuestDecider) {
    return NextResponse.json(
      { error: "You do not have permission to accept this connection request." },
      { status: 403 }
    );
  }

  const canConnect = await resolveViewerCanConnect(supabase, user.id);
  if (!canConnect) {
    return NextResponse.json({ error: "Complete and verify your profile first." }, { status: 403 });
  }

  let resolvedPartySize = match.party_size ?? 1;
  if (isGuestDecider && typeof clientPartySize === "number") {
    resolvedPartySize = clientPartySize;
  }
  const partySize = Math.min(Math.max(resolvedPartySize, 1), MAX_PARTY_SIZE);

  const { data: hostProfile } = await supabase
    .from("profiles")
    .select("stripe_account_id, payouts_enabled, full_name")
    .eq("id", match.host_id)
    .single();

  const hostEarningsEur = (partySize * HOST_PAYOUT_CENTS) / 100;
  const isHostAccepting = user.id === match.host_id;
  const hostId = match.host_id;

  /** Nudge the host by email — the guest is blocked until payouts are ready. */
  async function emailHostAboutPayoutSetup() {
    try {
      const { data: hostContact } = await supabase
        .from("profiles")
        .select("contact_email, full_name")
        .eq("id", hostId)
        .maybeSingle();

      if (!hostContact?.contact_email) return;

      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
      await resend.emails.send({
        from: "WALKINLOCALS <updates@walkinlocals.com>",
        to: [hostContact.contact_email],
        subject: `⏳ €${hostEarningsEur} is waiting — add your bank details`,
        html: `
          <div style="font-family: serif; color: #0f172a; max-width: 600px; margin: 0 auto; padding: 20px;">
            <p style="font-family: monospace; font-size: 10px; text-transform: uppercase; letter-spacing: 0.2em; color: #002FA7;">WALKINLOCALS Notification</p>
            <h2 style="font-weight: normal; font-size: 24px; margin-top: 10px;">A backpacker is waiting to confirm</h2>
            <p style="font-size: 16px; line-height: 1.6; font-weight: 300;">Hello ${hostContact.full_name ?? "there"},</p>
            <p style="font-size: 16px; line-height: 1.6; font-weight: 300;">
              A backpacker just tried to confirm a visit with you, but they can&apos;t pay until your Stripe payout
              details are set up. You have <strong style="color: #002FA7;">€${hostEarningsEur}</strong> waiting on this visit.
            </p>
            <div style="margin-top: 32px;">
              <a href="${appUrl}/matches" style="background-color: #002FA7; color: white; padding: 14px 28px; text-decoration: none; border-radius: 9999px; font-size: 14px; font-family: sans-serif; font-weight: 600;">Set up payouts</a>
            </div>
          </div>
        `,
      });
    } catch (emailErr) {
      console.error("Host payout setup email failed:", emailErr);
    }
  }

  function payoutSetupRequiredResponse() {
    if (isHostAccepting) {
      return NextResponse.json(
        {
          error: `You have €${hostEarningsEur} waiting. Add your bank details to accept this visit.`,
          code: "PAYOUT_SETUP_REQUIRED",
          hostEarningsEur,
        },
        { status: 409 },
      );
    }
    void emailHostAboutPayoutSetup();
    return NextResponse.json(
      {
        error:
          "This host hasn't finished their payout setup yet. We've just reminded them — you'll be able to confirm as soon as they do.",
        code: "HOST_PAYOUTS_PENDING",
      },
      { status: 409 },
    );
  }

  if (!hostProfile?.stripe_account_id) {
    return payoutSetupRequiredResponse();
  }

  let hostStripeAccount;
  try {
    hostStripeAccount = await stripe.accounts.retrieve(hostProfile.stripe_account_id);
  } catch {
    return payoutSetupRequiredResponse();
  }

  if (!hostPayoutsReady(hostStripeAccount)) {
    if (hostProfile.payouts_enabled) {
      await supabase
        .from("profiles")
        .update({ payouts_enabled: false })
        .eq("id", match.host_id);
    }
    return payoutSetupRequiredResponse();
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const totalAmount = MATCH_FEE_CENTS * partySize;
  const platformFee = PLATFORM_FEE_CENTS * partySize;

  let checkoutUrl: string | null;
  let checkoutSessionId: string | null = null;
  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "eur",
            unit_amount: MATCH_FEE_CENTS,
            product_data: {
              name: "Walk In Locals Connection Fee",
              description: "Unlocks contact details and chat access.",
            },
          },
          quantity: partySize,
        },
      ],
      payment_intent_data: {
        application_fee_amount: platformFee,
        transfer_data: {
          destination: hostProfile.stripe_account_id,
        },
      },
      expires_at: Math.floor(Date.now() / 1000) + 3600 * 2,
      success_url: `${appUrl}/matches?success=true&match=${match.id}`,
      cancel_url: `${appUrl}/matches`,
      metadata: {
        match_id: match.id,
        guest_id: match.guest_id,
        host_id: match.host_id,
        party_size: String(partySize),
        total_cents: String(totalAmount),
        host_account_id: hostProfile.stripe_account_id,
      },
    });
    checkoutUrl = session.url;
    checkoutSessionId = session.id;
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not create Stripe checkout session." },
      { status: 502 },
    );
  }

  if (!checkoutUrl) {
    return NextResponse.json({ error: "Stripe did not return a checkout URL." }, { status: 502 });
  }

  const { error: updateError } = await supabase
    .from("matches")
    .update({
      status: "Accepted",
      stripe_link: checkoutUrl,
      stripe_session_id: checkoutSessionId,
      party_size: partySize,
    })
    .eq("id", match.id);

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

  // --- Resend Notification for Acceptance ---
  try {
    const targetUserId = isHostDecider ? match.guest_id : match.host_id;
    const { data: targetProfile } = await supabase
      .from("profiles")
      .select("contact_email, full_name")
      .eq("id", targetUserId)
      .single();

    if (targetProfile?.contact_email) {
      await resend.emails.send({
        from: "WALKINLOCALS <updates@walkinlocals.com>",
        to: [targetProfile.contact_email],
        subject: "🎉 Connection Request Accepted!",
        html: `
          <div style="font-family: sans-serif; color: #0f172a; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #002FA7;">Your Connection Request Was Accepted!</h2>
            <p>Hello ${targetProfile.full_name},</p>
            <p>Great news! Your connection layout has been approved. Complete your checkout registration on your dashboard to unlock direct coordinates.</p>
            <a href="${appUrl}/matches" style="display: inline-block; background-color: #002FA7; color: white; padding: 12px 24px; text-decoration: none; border-radius: 9999px; font-weight: 600; margin-top: 15px;">Go to Dashboard</a>
          </div>
        `
      });
    }
  } catch (emailErr) {
    console.error("Failed sending acceptance notification:", emailErr);
  }

  return NextResponse.json({ status: "Accepted", stripe_link: checkoutUrl });
}
