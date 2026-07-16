"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { LogOut, Loader2 } from "lucide-react";

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

  const [loading, setLoading] = useState(true);
  const [isAuthed, setIsAuthed] = useState(false);
  const [profile, setProfile] = useState<NavProfile | null>(null);
  const [signingOut, setSigningOut] = useState(false);

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
      setLoading(false);
    }

    load();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => load());

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  async function handleSignOut() {
    setSigningOut(true);
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-40 border-b border-slate-150 bg-slate-50/80 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">

        {/* Brand Link with integrated small logo.png */}
        <Link
          href="/"
          className="flex items-center gap-2 text-lg font-semibold tracking-tight text-slate-950 transition-colors hover:text-[#002FA7]"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/logo.png"
            alt="WalkIn Locals Logo"
            className="h-5 w-5 object-contain shrink-0 rounded-md"
          />
          <span>
            WalkIn<span className="text-[#002FA7]"> Locals </span>
          </span>
        </Link>

        <div className="flex items-center gap-2 sm:gap-5">
          {loading ? (
            <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
          ) : !isAuthed ? (
            <LoggedOut />
          ) : (
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

function LoggedOut() {
  return (
    <>
      {/*
        Temporarily disabled for waitlist phase
        <Link
          href="/#our-story"
          className="hidden text-sm text-slate-600 transition hover:text-[#002FA7] sm:block font-medium"
        >
          Our Story
        </Link>
      */}

      {/*
        Temporarily disabled for waitlist phase
        <Link
          href="/login?mode=signup"
          className="rounded-full bg-[#002FA7] px-5 py-2 text-sm font-medium text-white transition duration-300 hover:bg-[#001e6c] shadow-[0_4px_15px_rgba(0,47,167,0.15)]"
        >
          Log in/Sign Up
        </Link>
      */}
    </>
  );
}

function ActiveLinks({
  profile,
  signingOut,
  onSignOut,
}: {
  profile: NavProfile;
  signingOut: boolean;
  onSignOut: () => void;
}) {
  return (
    <>
      <NavLink href="/">Home</NavLink>

      {profile.role === "Host" ? (
        <NavLink href="/guest-directory">Guests</NavLink>
      ) : (
        <NavLink href="/host-directory">Hosts</NavLink>
      )}

      <NavLink href="/matches">Matches</NavLink>

      <Link href="/profile" aria-label="Your profile" className="transition duration-300 hover:scale-[1.03] shrink-0">
        <Avatar name={profile.full_name} src={profile.avatar_url} />
      </Link>

      <SignOutButton signingOut={signingOut} onSignOut={onSignOut} />
    </>
  );
}

function SignOutButton({
  signingOut,
  onSignOut,
}: {
  signingOut: boolean;
  onSignOut: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSignOut}
      disabled={signingOut}
      className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-750 transition hover:bg-slate-100 hover:text-[#002FA7] hover:border-slate-300 disabled:opacity-60"
    >
      {signingOut ? <Loader2 className="h-4 w-4 animate-spin text-[#002FA7]" /> : <LogOut className="h-4 w-4" />}
      <span className="hidden sm:inline">Sign Out</span>
    </button>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="hidden text-sm font-medium text-slate-650 transition hover:text-[#002FA7] sm:block"
    >
      {children}
    </Link>
  );
}

function Avatar({ name, src }: { name: string | null; src: string | null }) {
  return (
    <span className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-slate-100 text-sm font-medium text-slate-700 ring-1 ring-slate-250 transition-colors hover:ring-[#002FA7]/50">
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={name ?? "Your avatar"} className="h-full w-full object-cover" />
      ) : (
        (name?.charAt(0)?.toUpperCase() ?? "?")
      )}
    </span>
  );
}