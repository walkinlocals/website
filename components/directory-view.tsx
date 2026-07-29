"use client";

import Image from "next/image";
import Link from "next/link";
import { MapPin, Clock } from "lucide-react";
import { useMemo } from "react";
import type { DirectoryProfile } from "@/lib/directory";
import type { DirectoryLiquidity } from "@/lib/directory";
import {
  DIRECTORY_CARD_CLASS,
  formatDirectoryLocation,
  formatLastActivity,
} from "@/lib/directory-display";
import { PAGE_MAIN, PAGE_SHELL } from "@/lib/page-layout";
import { homeEyebrow, heroTitle } from "@/lib/homepage-ui";

interface DirectoryViewProps {
  role: "Host" | "Guest";
  profiles: DirectoryProfile[];
  liquidity: DirectoryLiquidity;
  error: string | null;
  initialSearchQuery?: string;
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
    emptySearchTitle: "No hosts match your search.",
    errorTitle: "Could not load hosts.",
    fallbackName: "Host",
  },
  Guest: {
    title: "Backpackers in",
    titleAccent: "Dublin",
    description:
      "Meet backpackers hoping for an authentic afternoon. Click a backpacker's card to read their story and welcome them in.",
    emptyTitle: "No backpackers are looking right now — check back soon.",
    emptyHint:
      "Backpackers stay visible here even when they have pending connections — activate your profile to appear too.",
    emptySearchTitle: "No backpackers match your search.",
    errorTitle: "Could not load backpackers.",
    fallbackName: "Backpacker",
  },
} as const;

function profileMatchesQuery(profile: DirectoryProfile, role: "Host" | "Guest", query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const parts = [
    profile.full_name,
    profile.bio,
    profile.neighborhood,
    profile.origin_location,
    formatDirectoryLocation(profile, role),
  ];
  const haystack = parts.filter(Boolean).join(" ").toLowerCase();
  return haystack.includes(q);
}

export default function DirectoryView({
  role,
  profiles,
  liquidity,
  error,
  initialSearchQuery = "",
}: DirectoryViewProps) {
  const copy = COPY[role];

  const filteredProfiles = useMemo(
    () => profiles.filter((p) => profileMatchesQuery(p, role, initialSearchQuery)),
    [profiles, role, initialSearchQuery],
  );

  const isFiltering = initialSearchQuery.trim().length > 0;

  return (
    <div className={`${PAGE_SHELL} font-sans text-slate-950`}>
      <main className={PAGE_MAIN}>
        <section className="mb-12 border-b border-slate-200/80 pb-12 lg:mb-14 lg:pb-14">
          <h1 className={heroTitle}>
            {copy.title}{" "}
            {copy.titleAccent}
          </h1>
          <p className="mt-5 max-w-4xl text-lg leading-relaxed text-slate-950 sm:text-xl sm:leading-relaxed">
            {copy.description}
          </p>
          <p className={`mt-4 ${homeEyebrow}`}>
            {liquidity.activeHosts} active hosts · {liquidity.activeGuests} active guests
          </p>
          {isFiltering ? (
            <p className="mt-4 text-lg text-slate-600 sm:text-xl">
              {filteredProfiles.length} result{filteredProfiles.length === 1 ? "" : "s"} for &ldquo;
              {initialSearchQuery.trim()}&rdquo; (from site search)
            </p>
          ) : null}
        </section>

        {error ? (
          <div className="border-b border-red-200/80 py-16 text-center">
            <p className="text-xl text-red-700 sm:text-2xl">{copy.errorTitle}</p>
            <p className="mt-3 text-lg text-red-600">{error}</p>
          </div>
        ) : filteredProfiles.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-xl text-slate-700 sm:text-2xl">
              {isFiltering ? copy.emptySearchTitle : copy.emptyTitle}
            </p>
            <p className="mt-3 text-lg leading-relaxed text-slate-600 sm:text-xl">
              {isFiltering ? "Try another search from the navbar." : copy.emptyHint}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
            {filteredProfiles.map((profile) => {
              const location = formatDirectoryLocation(profile, role);
              return (
                <Link key={profile.id} href={`/profile/${profile.id}`} className={DIRECTORY_CARD_CLASS}>
                  <div>
                    <div className="flex items-start gap-4">
                      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full bg-slate-100 ring-1 ring-slate-200/80 transition group-hover:ring-[#002FA7]/30 sm:h-24 sm:w-24">
                        {profile.avatar_url ? (
                          <Image
                            src={profile.avatar_url}
                            alt=""
                            fill
                            sizes="96px"
                            className="object-cover transition duration-300 group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-lg text-slate-400">
                            {profile.full_name?.charAt(0) ?? "?"}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-lg font-semibold text-slate-950 truncate sm:text-xl lg:text-2xl">
                          {profile.full_name ?? copy.fallbackName}
                        </p>
                        {location ? (
                          <p className="mt-1 flex items-center gap-1.5 text-base text-slate-600 sm:text-lg">
                            <MapPin className="h-5 w-5 shrink-0 text-[#002FA7]/70" />
                            <span className="truncate">{location}</span>
                          </p>
                        ) : null}
                      </div>
                    </div>
                    {profile.bio ? (
                      <p className="mt-4 text-lg leading-relaxed text-slate-600 line-clamp-4 sm:text-xl sm:leading-[1.65]">
                        {profile.bio}
                      </p>
                    ) : null}
                  </div>
                  <p className="flex items-center gap-2 text-base text-slate-500 sm:text-lg">
                    <Clock className="h-5 w-5" />
                    {formatLastActivity(profile.last_activity_at)}
                  </p>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
