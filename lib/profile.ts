import { INACTIVITY_SLEEP_DAYS } from "@/lib/inactivity";

export function buildFullName(firstName: string, lastName: string): string | null {
  const full = `${firstName.trim()} ${lastName.trim()}`.trim();
  return full || null;
}

export function maxDateOfBirthFor18Plus(): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 18);
  return d.toISOString().slice(0, 10);
}

/** Normalise DB / ISO values to YYYY-MM-DD for form inputs and age checks. */
export function normalizeDateOfBirth(dateOfBirth: string | null | undefined): string | null {
  if (!dateOfBirth?.trim()) return null;
  const trimmed = dateOfBirth.trim();
  const isoPrefix = trimmed.match(/^(\d{4}-\d{2}-\d{2})/);
  if (isoPrefix) return isoPrefix[1];
  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString().slice(0, 10);
}

/** Returns true if the ISO date string (YYYY-MM-DD) is at least 18 years ago. */
export function isAtLeast18FromDate(dateOfBirth: string | null | undefined): boolean {
  const normalized = normalizeDateOfBirth(dateOfBirth);
  if (!normalized) return false;
  const birth = new Date(`${normalized}T00:00:00`);
  if (Number.isNaN(birth.getTime())) return false;

  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age -= 1;
  }
  return age >= 18;
}

/**
 * Roughly three lines of prose. Guests and hosts both need enough of a story
 * for the other side to decide whether to open their door.
 */
export const MIN_BIO_CHARS = 180;

/** True when the story is long enough to be a real introduction. */
export function hasEnoughBio(bio: string | null | undefined): boolean {
  return (bio?.trim().length ?? 0) >= MIN_BIO_CHARS;
}

export interface ProfileCompletenessInput {
  role: string | null;
  first_name?: string | null;
  last_name?: string | null;
  full_name?: string | null;
  bio: string | null;
  avatar_url: string | null;
  neighborhood: string | null;
  origin_location: string | null;
  age_verified?: boolean;
  id_verified?: boolean;
  payouts_enabled?: boolean;
  date_of_birth?: string | null;
}

export interface ProfileCompletenessOptions {
  /** True when the user picked a photo in the form but has not uploaded yet. */
  hasPendingAvatar?: boolean;
}

function resolvedNameParts(profile: ProfileCompletenessInput): {
  first: string | null;
  last: string | null;
} {
  const first = profile.first_name?.trim() || null;
  const last = profile.last_name?.trim() || null;
  if (first && last) return { first, last };

  const parts = profile.full_name?.trim().split(/\s+/).filter(Boolean) ?? [];
  if (!parts.length) {
    return { first, last: last || first };
  }

  return {
    first: first || parts[0] || null,
    last: last || parts.slice(1).join(" ") || parts[0] || null,
  };
}

function isAgeRequirementMet(profile: ProfileCompletenessInput): boolean {
  if (profile.age_verified) return true;
  return isAtLeast18FromDate(profile.date_of_birth);
}

function resolvedLocation(profile: ProfileCompletenessInput): string | null {
  const neighborhood = profile.neighborhood?.trim() || null;
  const origin = profile.origin_location?.trim() || null;
  if (profile.role === "Guest") return origin || neighborhood;
  if (profile.role === "Host") return neighborhood || origin;
  return neighborhood || origin;
}

function daysSinceActivity(lastActivityAt: string | null | undefined): number | null {
  if (!lastActivityAt) return null;
  const ts = new Date(lastActivityAt).getTime();
  if (Number.isNaN(ts)) return null;
  return Math.floor((Date.now() - ts) / (1000 * 60 * 60 * 24));
}

function isAsleepProfile(profile: {
  is_active?: boolean;
  last_activity_at?: string | null;
}): boolean {
  if (profile.is_active !== false) return false;
  const days = daysSinceActivity(profile.last_activity_at);
  return days !== null && days >= INACTIVITY_SLEEP_DAYS;
}

function hasDisplayName(profile: ProfileCompletenessInput): boolean {
  const { first } = resolvedNameParts(profile);
  return Boolean(first?.trim() || profile.full_name?.trim());
}

/** Has enough public story details to appear in a directory listing. */
export function isBrowsableProfile(profile: ProfileCompletenessInput): boolean {
  const location = resolvedLocation(profile);
  return Boolean(
    profile.role &&
      hasDisplayName(profile) &&
      profile.bio?.trim() &&
      location &&
      profile.avatar_url &&
      isAgeRequirementMet(profile),
  );
}

export function isProfileComplete(
  profile: ProfileCompletenessInput,
  options?: ProfileCompletenessOptions,
): boolean {
  const location = resolvedLocation(profile);
  const hasAvatar = Boolean(profile.avatar_url || options?.hasPendingAvatar);

  return Boolean(
    profile.role &&
      hasDisplayName(profile) &&
      hasEnoughBio(profile.bio) &&
      location &&
      hasAvatar &&
      isAgeRequirementMet(profile) &&
      profile.id_verified,
  );
}

/**
 * Whether a profile should appear in host/guest directories.
 * Browseable profiles are listed even before formal activation (is_active),
 * so guests who filled their story are visible to hosts. Only hidden when
 * asleep (90+ days inactive). Match status does not affect visibility.
 */
export function isDirectoryVisible(
  profile: ProfileCompletenessInput & {
    is_active?: boolean;
    last_activity_at?: string | null;
  },
): boolean {
  if (!isBrowsableProfile(profile)) return false;
  if (profile.is_active === true) return true;
  if (isAsleepProfile(profile)) return false;
  return true;
}

export function profileActivationBlockers(
  profile: ProfileCompletenessInput,
  options?: ProfileCompletenessOptions,
): string[] {
  const missing: string[] = [];
  if (!profile.role) missing.push("choose Host or Guest");
  if (!hasDisplayName(profile)) missing.push("add your name");
  if (!hasEnoughBio(profile.bio)) {
    missing.push("write at least three lines about who you are, who you live with, and any pets");
  }
  if (!resolvedLocation(profile)) {
    missing.push(profile.role === "Host" ? "add your Dublin area" : "add your country");
  }
  if (!profile.avatar_url && !options?.hasPendingAvatar) missing.push("upload a profile photo");
  if (!isAgeRequirementMet(profile)) missing.push("confirm you are 18+ with your date of birth");
  if (!profile.id_verified) {
    missing.push("complete Stripe identity verification");
  }
  return missing;
}
