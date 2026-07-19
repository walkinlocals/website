import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { buildActivityUpdate } from "@/lib/activity";
import { ensureProfileRole } from "@/lib/profile-role";
import { isProfileComplete, isBrowsableProfile } from "@/lib/profile";

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select(
      "role, first_name, last_name, full_name, bio, avatar_url, neighborhood, origin_location, id_verified, age_verified, date_of_birth, payouts_enabled, is_active",
    )
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!profile) {
    return NextResponse.json({ ok: true });
  }

  await ensureProfileRole(supabase, user.id, {
    profileRole: profile.role,
    metadataRole: user.user_metadata?.role,
  });

  const { data: refreshedProfile, error: refreshError } = await supabase
    .from("profiles")
    .select(
      "role, first_name, last_name, full_name, bio, avatar_url, neighborhood, origin_location, id_verified, age_verified, date_of_birth, payouts_enabled, is_active",
    )
    .eq("id", user.id)
    .maybeSingle();

  if (refreshError) {
    return NextResponse.json({ error: refreshError.message }, { status: 500 });
  }

  if (!refreshedProfile) {
    return NextResponse.json({ ok: true });
  }

  const update = {
    ...buildActivityUpdate(refreshedProfile),
    inactivity_warning_sent_at: null,
  };
  const shouldActivate = isProfileComplete(refreshedProfile) || isBrowsableProfile(refreshedProfile);
  if (shouldActivate) {
    update.is_active = true;
  }

  const { error: updateError } = await supabase.from("profiles").update(update).eq("id", user.id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    is_active: update.is_active ?? refreshedProfile.is_active,
  });
}
