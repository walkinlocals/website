import type { SupabaseClient } from "@supabase/supabase-js";
import { isProfileComplete } from "@/lib/profile";

const VIEWER_PROFILE_SELECT =
  "role, first_name, last_name, full_name, bio, avatar_url, neighborhood, origin_location, date_of_birth, age_verified, id_verified, payouts_enabled, is_active";

/** True when the signed-in user has a complete profile; keeps is_active in sync. */
export async function resolveViewerCanConnect(
  supabase: SupabaseClient,
  userId: string,
): Promise<boolean> {
  const { data: profile } = await supabase
    .from("profiles")
    .select(VIEWER_PROFILE_SELECT)
    .eq("id", userId)
    .maybeSingle();

  if (!profile) return false;

  const complete = isProfileComplete(profile);
  if (!complete) return false;

  if (!profile.is_active) {
    const updates: { is_active: boolean; age_verified?: boolean } = { is_active: true };
    if (!profile.age_verified && profile.date_of_birth) {
      updates.age_verified = true;
    }
    await supabase.from("profiles").update(updates).eq("id", userId);
  }

  return true;
}
