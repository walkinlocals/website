import type { DirectoryProfile } from "@/lib/directory";

export function formatLastActivity(timestamp: string | null): string {
  if (!timestamp) return "Awhile ago";

  const lastActiveDate = new Date(timestamp);
  const currentDate = new Date();
  const diffTime = Math.abs(currentDate.getTime() - lastActiveDate.getTime());
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    if (diffHours === 0) return "Active just now";
    return `Active ${diffHours}h ago`;
  }
  if (diffDays === 1) return "Active yesterday";
  if (diffDays < 7) return `Active ${diffDays} days ago`;

  const diffWeeks = Math.floor(diffDays / 7);
  if (diffWeeks === 1) return "Active last week";
  return `Active ${diffWeeks} weeks ago`;
}

export function formatDirectoryLocation(
  profile: Pick<DirectoryProfile, "neighborhood" | "origin_location">,
  role: "Host" | "Guest",
): string | null {
  if (role === "Host") {
    return profile.neighborhood?.trim() || null;
  }
  const origin = profile.origin_location?.trim();
  return origin ? `From ${origin}` : null;
}

export const DIRECTORY_CARD_CLASS =
  "group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_4px_15px_rgba(0,47,167,0.01)] transition-all duration-500 hover:border-[#002FA7]/30 hover:bg-[#002fa7]/[0.01] hover:shadow-[0_15px_45px_rgba(0,47,167,0.03)]";
