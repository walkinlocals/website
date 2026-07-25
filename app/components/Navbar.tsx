"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { pingActivity } from "@/lib/activity-client";
import { Loader2, Menu, Search, X } from "lucide-react";

type Role = "Host" | "Guest" | "Admin";

interface NavProfile {
  role: Role | null;
  full_name: string | null;
  avatar_url: string | null;
  is_active: boolean;
}

const MENU_LINKS = [
  { href: "/", label: "Home" },
  { href: "/about-us", label: "About Us" },
  { href: "/how-it-works", label: "How It Works" },
  { href: "/get-paid", label: "Get Paid" },
  { href: "/pay", label: "Pay" },
  { href: "/terms", label: "Terms" },
] as const;

export default function Navbar() {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [isAuthed, setIsAuthed] = useState(false);
  const [profile, setProfile] = useState<NavProfile | null>(null);
  const [signingOut, setSigningOut] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
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

  useEffect(() => {
    if (!menuOpen) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  async function handleSignOut() {
    setSigningOut(true);
    setMenuOpen(false);
    await supabase.auth.signOut();
    setIsAuthed(false);
    setProfile(null);
    router.push("/");
    router.refresh();
  }

  function handleSearchSubmit(event: React.FormEvent) {
    event.preventDefault();
    setMenuOpen(false);
    if (!isAuthed) {
      router.push("/login?mode=signup&role=Guest");
      return;
    }
    if (profile?.role === "Host") {
      router.push("/guest-directory");
      return;
    }
    router.push("/host-directory");
  }

  const menuLinks = isAuthed
    ? [
        { href: "/", label: "Home" },
        ...(profile?.role === "Host"
          ? [{ href: "/guest-directory", label: "Guests" }]
          : [{ href: "/host-directory", label: "Hosts" }]),
        { href: "/matches", label: "Matches" },
        { href: "/profile", label: "Profile" },
        { href: "/about-us", label: "About Us" },
        { href: "/how-it-works", label: "How It Works" },
        { href: "/get-paid", label: "Get Paid" },
        { href: "/pay", label: "Pay" },
        { href: "/terms", label: "Terms" },
      ]
    : MENU_LINKS.map((link) => ({ ...link }));

  return (
    <header id="site-navbar" className="sticky top-0 z-50 border-b border-slate-200 bg-white relative">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <nav className="flex items-center gap-3 py-3 sm:gap-4 sm:py-4">
          <Link href="/" className="flex shrink-0 items-center gap-2.5">
            <span className="text-base font-semibold tracking-tight text-slate-950 sm:text-lg">
              WalkIn<span className="text-[#002FA7]">Locals</span>
            </span>
            <img src="/images/logo.png" alt="" className="h-8 w-8 object-contain sm:h-9 sm:w-9" />
          </Link>

          <div className="ml-auto flex min-w-0 flex-1 items-center justify-end gap-2 sm:gap-3">
            <form
              onSubmit={handleSearchSubmit}
              className="hidden min-w-0 md:block md:w-[min(100%,280px)] lg:w-[min(100%,320px)]"
            >
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search Dublin hosts…"
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-800 placeholder:text-slate-400 focus:border-[#002FA7] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#002FA7]"
                />
              </div>
            </form>

            {!loading && !isAuthed ? (
              <>
                <Link
                  href="/login"
                  className="hidden text-sm font-medium text-slate-700 hover:text-[#002FA7] sm:inline"
                >
                  Sign In
                </Link>
                <Link
                  href="/login?mode=signup"
                  className="hidden rounded-lg bg-[#002FA7] px-4 py-2 text-sm font-medium text-white hover:bg-[#001e6c] sm:inline"
                >
                  Sign Up
                </Link>
              </>
            ) : null}

            {isAuthed && profile ? (
              <Link href="/profile" className="hidden sm:block">
                <span className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-slate-100 ring-1 ring-slate-200">
                  {profile.avatar_url ? (
                    <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    profile.full_name?.charAt(0)?.toUpperCase() ?? "?"
                  )}
                </span>
              </Link>
            ) : null}

            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              aria-expanded={menuOpen}
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-700 hover:border-[#002FA7]/30 hover:text-[#002FA7]"
            >
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </nav>

        <form onSubmit={handleSearchSubmit} className="pb-3 md:hidden">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Dublin hosts…"
              className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm focus:border-[#002FA7] focus:outline-none focus:ring-1 focus:ring-[#002FA7]"
            />
          </div>
        </form>
      </div>

      {menuOpen ? (
        <>
          <button
            type="button"
            aria-label="Close menu backdrop"
            className="fixed inset-0 top-[var(--navbar-height,0)] z-40 bg-slate-950/20"
            onClick={() => setMenuOpen(false)}
          />
          <div
            id="site-menu-panel"
            className="absolute right-4 top-full z-50 mt-1 w-[min(100vw-2rem,280px)] rounded-xl border border-slate-200 bg-white py-2 shadow-lg sm:right-6"
          >
            {loading ? (
              <div className="flex justify-center py-6">
                <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
              </div>
            ) : (
              <ul className="flex flex-col">
                {menuLinks.map((link) => (
                  <li key={`${link.href}-${link.label}`}>
                    <Link
                      href={link.href}
                      onClick={() => setMenuOpen(false)}
                      className="block px-4 py-3 text-sm font-medium text-slate-700 hover:bg-[#002FA7]/5 hover:text-[#002FA7]"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
                {isAuthed ? (
                  <li>
                    <button
                      type="button"
                      onClick={handleSignOut}
                      disabled={signingOut}
                      className="block w-full px-4 py-3 text-left text-sm font-medium text-slate-700 hover:bg-[#002FA7]/5 hover:text-[#002FA7] disabled:opacity-50"
                    >
                      {signingOut ? "Signing out…" : "Sign Out"}
                    </button>
                  </li>
                ) : null}
              </ul>
            )}
          </div>
        </>
      ) : null}
    </header>
  );
}
