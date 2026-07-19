import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { stripe } from "@/lib/stripe/server";
import { isProfileComplete } from "@/lib/profile";
import { hostPayoutsReady } from "@/lib/stripe-host-payouts";

/** Sync Stripe Connect account status → payouts_enabled / id_verified on the profile. */
export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select(
      "role, stripe_account_id, payouts_enabled, id_verified, is_active, first_name, last_name, full_name, bio, avatar_url, neighborhood, origin_location, age_verified, date_of_birth",
    )
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    return NextResponse.json({ error: "Profile not found." }, { status: 404 });
  }

  if (profile.role !== "Host") {
    return NextResponse.json({ error: "Only hosts have payout accounts." }, { status: 403 });
  }

  if (!profile.stripe_account_id) {
    return NextResponse.json({
      status: "none",
      payouts_enabled: false,
      id_verified: profile.id_verified,
      is_active: profile.is_active,
    });
  }

  try {
    const account = await stripe.accounts.retrieve(profile.stripe_account_id);
    const payoutsEnabled = hostPayoutsReady(account);
    const identityVerified =
      account.individual?.verification?.status === "verified" || payoutsEnabled;

    const updates: {
      payouts_enabled: boolean;
      id_verified?: boolean;
      is_active?: boolean;
    } = { payouts_enabled: payoutsEnabled };

    if (identityVerified) {
      updates.id_verified = true;
    }

    const mergedProfile = {
      ...profile,
      payouts_enabled: payoutsEnabled,
      id_verified: identityVerified || profile.id_verified,
    };

    if (isProfileComplete(mergedProfile)) {
      updates.is_active = true;
    }

    await supabaseAdmin.from("profiles").update(updates).eq("id", user.id);

    return NextResponse.json({
      status: payoutsEnabled ? "active" : account.details_submitted ? "pending" : "incomplete",
      payouts_enabled: payoutsEnabled,
      id_verified: updates.id_verified ?? profile.id_verified,
      is_active: updates.is_active ?? profile.is_active,
      details_submitted: account.details_submitted,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not read Stripe account." },
      { status: 502 },
    );
  }
}
