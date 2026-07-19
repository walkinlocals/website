import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { stripe } from "@/lib/stripe/server";
import { isProfileComplete } from "@/lib/profile";

/** Sync Stripe Identity status → id_verified only. Age comes from user-entered date of birth. */
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
      "stripe_verification_session_id, id_verified, age_verified, is_active, role, first_name, last_name, full_name, bio, avatar_url, neighborhood, origin_location, payouts_enabled, date_of_birth",
    )
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    return NextResponse.json({ error: "Profile not found." }, { status: 404 });
  }

  const sessionId = profile.stripe_verification_session_id;
  if (!sessionId) {
    return NextResponse.json({
      status: "none",
      id_verified: profile.id_verified,
      age_verified: profile.age_verified,
      is_active: profile.is_active,
    });
  }

  try {
    const session = await stripe.identity.verificationSessions.retrieve(sessionId);

    if (session.status === "verified") {
      const updates: {
        id_verified: boolean;
        age_verified?: boolean;
        is_active?: boolean;
      } = { id_verified: true };

      const normalizedDob = profile.date_of_birth
        ? String(profile.date_of_birth).slice(0, 10)
        : null;

      const updatedProfile = {
        ...profile,
        id_verified: true,
        date_of_birth: normalizedDob,
        age_verified: profile.age_verified || Boolean(normalizedDob),
      };

      if (isProfileComplete(updatedProfile)) {
        updates.is_active = true;
        if (!profile.age_verified && normalizedDob) {
          updates.age_verified = true;
        }
      }

      await supabaseAdmin.from("profiles").update(updates).eq("id", user.id);

      return NextResponse.json({
        status: "verified",
        id_verified: true,
        age_verified: updates.age_verified ?? profile.age_verified,
        is_active: updates.is_active ?? profile.is_active,
      });
    }

    return NextResponse.json({
      status: session.status,
      id_verified: profile.id_verified,
      age_verified: profile.age_verified,
      is_active: profile.is_active,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not read verification session." },
      { status: 502 },
    );
  }
}
