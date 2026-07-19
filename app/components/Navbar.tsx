"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { pingActivity } from "@/lib/activity-client";
import { LogOut, Loader2 } from "lucide-react";

type Role = "Host" | "Guest" | "Admin";

interface NavProfile {
  role: Role | null;
  full_name: string | null;
  avatar_url: string | null;
  is_active: boolean;
}

const NAV_LINK_CLASS =
  "hidden sm:block text-sm font-medium text-slate-650 hover:text-[#002FA7] transition";

export default function Navbar() {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [isAuthed, setIsAuthed] = useState(false);
  const [profile, setProfile] = useState<NavProfile | null>(null);
  const [signingOut, setSigningOut] = useState(false);
  const [syncTrigger, setSyncTrigger] = useState(0);

  useEffect(() => {
    let active = true;

    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!active) return;

      if (!user) {
        setIsAuthed(false);
        setProfile(null);
        setLoading(false);
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
      setLoading(false);
    }

    load();

    const matchesChannel = supabase
      .channel("navbar-live-sync")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "matches" },
        () => {
          router.refresh();
          setSyncTrigger((prev) => prev + 1);
        }
      )
      .subscribe();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => load());

    return () => {
      active = false;
      subscription.unsubscribe();
      supabase.removeChannel(matchesChannel);
    };
  }, [supabase, router, syncTrigger]);

  async function handleSignOut() {
    setSigningOut(true);
    await supabase.auth.signOut();
    setIsAuthed(false);
    setProfile(null);
    router.push("/");
    router.refresh();
  }

  return (
    <header
      id="site-navbar"
      className="sticky top-0 z-40 border-b border-slate-150 bg-slate-50/80 backdrop-blur"
    >
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        {/* Always visible brand identity */}
        <Link href="/" className="flex items-center gap-2 text-lg font-semibold tracking-tight text-slate-950 transition-colors hover:text-[#002FA7]">
          <img src="/images/logo.png" alt="WalkIn Locals Logo" className="h-5 w-5 object-contain shrink-0 rounded-md" />
          <span>WalkIn<span className="text-[#002FA7]"> Locals </span></span>
        </Link>

        {/* Dynamic actions wrapper */}
        <div className="flex items-center gap-3 sm:gap-5">
          {loading ? (
            <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
          ) : !isAuthed ? (
            /* FIX: Instead of returning null, show Sign In and Sign Up buttons if logged out */
            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className="text-sm font-medium text-slate-650 hover:text-[#002FA7] transition"
              >
                Sign In
              </Link>
              <Link
                href="/login?mode=signup"
                className="rounded-full bg-[#002FA7] px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-[#001e6c] transition"
              >
                Sign Up
              </Link>
            </div>
          ) : (
            /* Revealed immediately when user session resolves successfully */
            <ActiveLinks
              profile={profile ?? { role: null, full_name: null, avatar_url: null, is_active: false }}
              signingOut={signingOut}
              onSignOut={handleSignOut}
            />
          )}
        </div>
      </nav>
    </header>
  );
}

function ActiveLinks({ profile, signingOut, onSignOut }: { profile: NavProfile; signingOut: boolean; onSignOut: () => void }) {
  return (
    <>
      <Link href="/" className={NAV_LINK_CLASS}>Home</Link>

      {profile.role === "Host" ? (
        <Link href="/guest-directory" className={NAV_LINK_CLASS}>Guests</Link>
      ) : (
        <Link href="/host-directory" className={NAV_LINK_CLASS}>Hosts</Link>
      )}

      <Link href="/matches" className={NAV_LINK_CLASS}>Matches</Link>

      <Link href="/profile" aria-label="Your profile" className="transition hover:scale-[1.03] shrink-0">
        <span className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-slate-100 text-sm font-medium text-slate-700 ring-1 ring-slate-250 hover:ring-[#002FA7]/50">
          {profile.avatar_url ? (
            <img src={profile.avatar_url} alt="Avatar" className="h-full w-full object-cover" />
          ) : (
            (profile.full_name?.charAt(0)?.toUpperCase() ?? "?")
          )}
        </span>
      </Link>

      <button
        type="button"
        onClick={onSignOut}
        disabled={signingOut}
        className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-750 hover:bg-slate-100 hover:text-[#002FA7] disabled:opacity-60"
      >
        {signingOut ? <Loader2 className="h-4 w-4 animate-spin text-[#002FA7]" /> : <LogOut className="h-4 w-4" />}
        <span className="hidden sm:inline">Sign Out</span>
      </button>
    </>
  );
}