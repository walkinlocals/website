"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { pingActivity } from "@/lib/activity-client";
import { SITE_GUTTER } from "@/lib/page-layout";
import { brandWordmark, BRAND_NAME } from "@/lib/homepage-ui";

type Role = "Host" | "Guest" | "Admin";

interface NavProfile {
  role: Role | null;
  full_name: string | null;
  avatar_url: string | null;
  is_active: boolean;
}

export default function Navbar() {
  const router = useRouter();
  const supabase = createClient();

  const [isAuthed, setIsAuthed] = useState(false);
  const [profile, setProfile] = useState<NavProfile | null>(null);
  const [syncTrigger, setSyncTrigger] = useState(0);

  useEffect(() => {
    let active = true;

    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!active) return;

      if (!user) {
        setIsAuthed(false);
        setProfile(null);
        return;
      }

      setIsAuthed(true);
      const { data } = await supabase
        .from("profiles")
        .select("role, full_name, avatar_url, is_active")
        .eq("id", user.id)
        .single();
      if (!active) return;

      setProfile({
        role: data?.role ?? null,
        full_name: data?.full_name ?? null,
        avatar_url: data?.avatar_url ?? null,
        is_active: data?.is_active ?? false,
      });
      pingActivity();
    }

    load();

    const matchesChannel = supabase
      .channel("navbar-live-sync")
      .on("postgres_changes", { event: "*", schema: "public", table: "matches" }, () => {
        router.refresh();
        setSyncTrigger((prev) => prev + 1);
      })
      .subscribe();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => load());

    return () => {
      active = false;
      subscription.unsubscribe();
      supabase.removeChannel(matchesChannel);
    };
  }, [supabase, router, syncTrigger]);

  return (
    <header id="site-navbar" className="sticky top-0 z-50 border-b border-slate-200 bg-white relative">
      <div className={`w-full ${SITE_GUTTER}`}>
        <nav className="flex items-center gap-3 py-4 sm:gap-6 sm:py-5 lg:py-6">
          <Link href="/" className="flex shrink-0 items-center gap-3">
            <span className={brandWordmark}>{BRAND_NAME}</span>
            <img src="/images/logo.png" alt="" className="h-11 w-11 object-contain sm:h-12 sm:w-12" />
          </Link>

          {isAuthed && profile ? (
            <Link href="/profile" className="ml-auto shrink-0">
              <span className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-slate-100 text-lg font-medium ring-1 ring-slate-200 sm:h-[3.6rem] sm:w-[3.6rem] sm:text-xl">
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
                ) : (
                  profile.full_name?.charAt(0)?.toUpperCase() ?? "?"
                )}
              </span>
            </Link>
          ) : null}
        </nav>
      </div>
    </header>
  );
}
