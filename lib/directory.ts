import type { SupabaseClient } from "@supabase/supabase-js";
import type { AppRole } from "@/lib/profile-role";
import { isDirectoryVisible } from "@/lib/profile";

export interface DirectoryProfile {
  id: string;
  full_name: string | null;
  neighborhood: string | null;
  origin_location: string | null;
  bio: string | null;
  avatar_url: string | null;
  last_activity_at: string | null;
}

export async function fetchDirectoryProfiles(
  supabase: SupabaseClient,
  role: AppRole,
  excludeUserId: string,
): Promise<{ profiles: DirectoryProfile[]; error: string | null }> {
  const { data, error } = await supabase
    .from("profiles")
    .select(DIRECTORY_PROFILE_SELECT)
    .eq("role", role)
    .neq("id", excludeUserId);

  if (error) {
    return { profiles: [], error: error.message };
  }

  const profiles = (data ?? [])
    .filter((profile) => isDirectoryVisible(profile))
    .map(({ id, full_name, neighborhood, origin_location, bio, avatar_url, last_activity_at }) => ({
      id,
      full_name,
      neighborhood,
      origin_location,
      bio,
      avatar_url,
      last_activity_at,
    }));

  return { profiles, error: null };
}

export interface DirectoryLiquidity {
  activeHosts: number;
  activeGuests: number;
}

const DIRECTORY_PROFILE_SELECT =
  "id, full_name, first_name, last_name, role, neighborhood, origin_location, bio, avatar_url, last_activity_at, date_of_birth, age_verified, is_active";

export async function fetchDirectoryLiquidity(
  supabase: SupabaseClient,
): Promise<DirectoryLiquidity> {
  const { data } = await supabase
    .from("profiles")
    .select(DIRECTORY_PROFILE_SELECT)
    .in("role", ["Host", "Guest"]);

  const complete = (data ?? []).filter((profile) => isDirectoryVisible(profile));
  const activeHosts = complete.filter((p) => p.role === "Host").length;
  const activeGuests = complete.filter((p) => p.role === "Guest").length;

  return { activeHosts, activeGuests };
}
