import Link from "next/link";
import { MapPin, Clock } from "lucide-react";
import type { DirectoryProfile } from "@/lib/directory";
import type { DirectoryLiquidity } from "@/lib/directory";
import {
  DIRECTORY_CARD_CLASS,
  formatDirectoryLocation,
  formatLastActivity,
} from "@/lib/directory-display";
import { PAGE_BG_DOTS, PAGE_CONTAINER, PAGE_SHELL } from "@/lib/page-layout";

interface DirectoryViewProps {
  role: "Host" | "Guest";
  profiles: DirectoryProfile[];
  liquidity: DirectoryLiquidity;
  error: string | null;
}

const COPY = {
  Host: {
    title: "Discover Dublin",
    titleAccent: "Hosts",
    description:
      "Real homes and the gracious locals who open them. Click a host's card to read their story and request an unhurried visit.",
    emptyTitle: "No hosts are available yet — check back soon.",
    emptyHint:
      "Hosts stay visible here even when they have pending connections — activate your profile to appear too.",
    errorTitle: "Could not load hosts.",
    fallbackName: "Host",
  },
  Guest: {
    title: "Travelers in",
    titleAccent: "Dublin",
    description:
      "Meet travelers hoping for an authentic afternoon. Click a traveler's card to read their story and welcome them in.",
    emptyTitle: "No travelers are looking right now — check back soon.",
    emptyHint:
      "Travelers stay visible here even when they have pending connections — activate your profile to appear too.",
    errorTitle: "Could not load travelers.",
    fallbackName: "Traveler",
  },
} as const;

export default function DirectoryView({ role, profiles, liquidity, error }: DirectoryViewProps) {
  const copy = COPY[role];

  return (
    <div className={PAGE_SHELL}>
      <div className={PAGE_BG_DOTS} />

      <main className={`${PAGE_CONTAINER} py-14 text-slate-900 sm:py-20`}>
        <section className="relative mb-12 border-b border-slate-100 pb-12">
          <span className="inline-flex items-center gap-1 font-mono text-[9px] uppercase tracking-[0.3em] text-[#002FA7] font-semibold bg-[#002fa7]/5 px-3 py-1 rounded-full">
            ✦ WalkIn Locals ✦
          </span>
          <h1 className="mt-4 font-serif text-4xl font-normal tracking-tight text-slate-950 sm:text-6xl">
            {copy.title}{" "}
            <span className="italic text-[#002FA7]">{copy.titleAccent}</span>
          </h1>
          <p className="mt-4 max-w-2xl text-base font-light leading-relaxed text-slate-500 sm:text-lg">
            {copy.description}
          </p>
          <p className="mt-3 font-mono text-[10px] uppercase tracking-wider text-slate-400">
            {liquidity.activeHosts} active hosts · {liquidity.activeGuests} active guests
          </p>
        </section>

        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50/50 p-12 text-center space-y-3">
            <p className="font-serif text-lg italic text-red-600">{copy.errorTitle}</p>
            <p className="text-sm font-light text-red-500">{error}</p>
          </div>
        ) : profiles.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 p-12 text-center bg-slate-50/50 space-y-3">
            <p className="font-serif text-lg italic text-slate-500">{copy.emptyTitle}</p>
            <p className="text-sm font-light text-slate-400 max-w-md mx-auto leading-relaxed">{copy.emptyHint}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {profiles.map((profile) => {
              const location = formatDirectoryLocation(profile, role);
              return (
                <Link key={profile.id} href={`/profile/${profile.id}`} className={DIRECTORY_CARD_CLASS}>
                  <div>
                    <div className="flex items-start gap-4">
                      <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-full border border-slate-150 bg-slate-50">
                        {profile.avatar_url ? (
                          <img
                            src={profile.avatar_url}
                            alt={profile.full_name ?? copy.fallbackName}
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-xl font-light text-slate-400">
                            {profile.full_name?.charAt(0) ?? "?"}
                          </div>
                        )}
                      </div>

                      <div className="space-y-1 min-w-0">
                        <h2 className="font-serif text-xl font-normal text-slate-950 transition-colors duration-300 group-hover:text-[#002FA7] truncate">
                          {profile.full_name ?? copy.fallbackName}
                        </h2>
                        <div className="flex flex-col gap-0.5">
                          {location && (
                            <p className="flex items-center gap-1 font-mono text-[9px] uppercase tracking-wider text-slate-400">
                              <MapPin className="h-3 w-3 text-[#002FA7]/70 shrink-0" />
                              <span className="truncate">{location}</span>
                            </p>
                          )}
                          <p className="flex items-center gap-1 font-mono text-[8px] tracking-normal text-slate-400/60">
                            <Clock className="h-2 w-2 text-slate-300 group-hover:text-[#002FA7]/40 transition-colors duration-300 shrink-0" />
                            <span>{formatLastActivity(profile.last_activity_at)}</span>
                          </p>
                        </div>
                      </div>
                    </div>

                    {profile.bio && (
                      <p className="mt-4 line-clamp-3 text-sm font-light leading-relaxed text-slate-500 transition-colors duration-300 group-hover:text-slate-700">
                        {profile.bio}
                      </p>
                    )}
                  </div>

                  <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4">
                    <span className="font-mono text-[10px] font-semibold uppercase tracking-widest text-[#002FA7] transition-colors duration-300 group-hover:text-slate-950">
                      View profile
                    </span>
                    <span className="font-mono text-xs text-slate-300 transition-transform duration-300 group-hover:translate-x-1 group-hover:text-[#002FA7]">
                      →
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
