import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { stripe } from "@/lib/stripe/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { isProfileComplete } from "@/lib/profile";
import { Resend } from "resend";
import type Stripe from "stripe";
import { hostPayoutsReady } from "@/lib/stripe-host-payouts";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return NextResponse.json({ error: "STRIPE_WEBHOOK_SECRET is not configured." }, { status: 500 });
  }

  const headerList = await headers();
  const signature = headerList.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature header." }, { status: 400 });
  }

  const rawBody = await request.text();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    return NextResponse.json(
      { error: `Signature verification failed: ${err instanceof Error ? err.message : "unknown"}` },
      { status: 400 },
    );
  }

  try {
    switch (event.type) {
      case "identity.verification_session.verified": {
        const session = event.data.object as Stripe.Identity.VerificationSession;
        const userId = session.metadata?.user_id;
        if (!userId) break;

        await supabaseAdmin.from("profiles").update({ id_verified: true }).eq("id", userId);

        const { data: profile } = await supabaseAdmin
          .from("profiles")
          .select(
            "role, first_name, last_name, full_name, avatar_url, bio, contact_email, origin_location, neighborhood, id_verified, age_verified, payouts_enabled, date_of_birth",
          )
          .eq("id", userId)
          .single();

        if (profile && isProfileComplete(profile)) {
          await supabaseAdmin.from("profiles").update({ is_active: true }).eq("id", userId);
        }
        break;
      }
      case "account.updated": {
        const account = event.data.object as Stripe.Account;
        const userId = account.metadata?.user_id;

        const payoutsEnabled = hostPayoutsReady(account);
        const identityVerified =
          account.individual?.verification?.status === "verified" || payoutsEnabled;
        const updates: { payouts_enabled: boolean; id_verified?: boolean } = {
          payouts_enabled: payoutsEnabled,
        };
        if (identityVerified) {
          updates.id_verified = true;
        }

        if (userId) {
          await supabaseAdmin.from("profiles").update(updates).eq("id", userId);

          const { data: profile } = await supabaseAdmin
            .from("profiles")
            .select(
              "role, first_name, last_name, bio, avatar_url, neighborhood, origin_location, id_verified, age_verified, payouts_enabled",
            )
            .eq("id", userId)
            .single();

          if (profile && isProfileComplete(profile)) {
            await supabaseAdmin.from("profiles").update({ is_active: true }).eq("id", userId);
          }
        } else {
          await supabaseAdmin
            .from("profiles")
            .update(updates)
            .eq("stripe_account_id", account.id);
        }
        break;
      }
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const matchId = session.metadata?.match_id;
        if (matchId) {
          const { data: match, error: matchErr } = await supabaseAdmin
            .from("matches")
            .update({ status: "Paid" })
            .eq("id", matchId)
            .select("guest_id, host_id, party_size")
            .single();

          if (matchErr) throw matchErr;

          const [guestRes, hostRes] = await Promise.all([
            supabaseAdmin.from("profiles").select("full_name, contact_email, phone").eq("id", match.guest_id).single(),
            supabaseAdmin.from("profiles").select("full_name, contact_email, phone").eq("id", match.host_id).single(),
          ]);

          const guest = guestRes.data;
          const host = hostRes.data;

          if (guest?.contact_email && host?.contact_email) {
            await resend.emails.send({
              from: "WalkIn Locals <bookings@walkinlocals.com>",
              to: [guest.contact_email],
              subject: "🔓 Connections Unlocked! Your Host Contact Details",
              html: `
                <div style="font-family: serif; color: #0f172a; max-width: 600px; margin: 0 auto; padding: 20px;">
                  <p style="font-family: monospace; font-size: 10px; text-transform: uppercase; letter-spacing: 0.2em; color: #002FA7;">WalkIn Locals Connection Dossier</p>
                  <h2 style="font-weight: normal; font-size: 24px; margin-top: 10px;">Your host details are unlocked!</h2>
                  <p style="font-size: 16px; font-weight: 300;">You are connected with <strong>${host.full_name}</strong>.</p>
                  <div style="background-color: #f8fafc; border-radius: 16px; padding: 24px; margin: 24px 0; font-family: monospace; font-size: 14px;">
                    <p style="margin: 0 0 10px 0;"><strong>Direct Email:</strong> ${host.contact_email}</p>
                    <p style="margin: 0;"><strong>Phone Number:</strong> ${host.phone || "Not specified"}</p>
                  </div>
                </div>
              `
            });

            await resend.emails.send({
              from: "WalkIn Locals <bookings@walkinlocals.com>",
              to: [host.contact_email],
              subject: "🔓 Connections Unlocked! Your Guest Contact Details",
              html: `
                <div style="font-family: serif; color: #0f172a; max-width: 600px; margin: 0 auto; padding: 20px;">
                  <p style="font-family: monospace; font-size: 10px; text-transform: uppercase; letter-spacing: 0.2em; color: #002FA7;">WalkIn Locals Connection Dossier</p>
                  <h2 style="font-weight: normal; font-size: 24px; margin-top: 10px;">Your guest details are unlocked!</h2>
                  <p style="font-size: 16px; font-weight: 300;">Connected with <strong>${guest.full_name}</strong> (Party Size: ${match.party_size}).</p>
                  <div style="background-color: #f8fafc; border-radius: 16px; padding: 24px; margin: 24px 0; font-family: monospace; font-size: 14px;">
                    <p style="margin: 0 0 10px 0;"><strong>Direct Email:</strong> ${guest.contact_email}</p>
                    <p style="margin: 0;"><strong>Phone Number:</strong> ${guest.phone || "Not specified"}</p>
                  </div>
                </div>
              `
            });
          }
        }
        break;
      }
    }
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Webhook processing fault." },
      { status: 500 },
    );
  }

  return NextResponse.json({ received: true });
}
