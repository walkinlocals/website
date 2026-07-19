import { isProfileComplete } from "@/lib/profile";

export interface ActivityProfile {
  role: string | null;
  first_name?: string | null;
  last_name?: string | null;
  full_name?: string | null;
  bio: string | null;
  avatar_url: string | null;
  neighborhood: string | null;
  origin_location: string | null;
  id_verified: boolean;
  age_verified?: boolean;
  date_of_birth?: string | null;
  payouts_enabled?: boolean;
  is_active?: boolean;
}

export function buildActivityUpdate(profile: ActivityProfile): {
  last_activity_at: string;
  is_active?: boolean;
} {
  const update: { last_activity_at: string; is_active?: boolean } = {
    last_activity_at: new Date().toISOString(),
  };

  if (isProfileComplete(profile)) {
    update.is_active = true;
  }

  return update;
}
