"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { pingActivity } from "@/lib/activity-client";
import { directorySearchHref, searchSite } from "@/lib/site-search";
import { SITE_GUTTER } from "@/lib/page-layout";
import { brandWordmark, BRAND_NAME } from "@/lib/homepage-ui";
import { Loader2, Menu, Search, X } from "lucide-react";

type Role = "Host" | "Guest" | "Admin";

interface NavProfile {
  role: Role | null;
  full_name: string | null;
  avatar_url: string | null;
  is_active: boolean;
}

const PUBLIC_MENU_LINKS = [
  { href: "/", label: "Home" },
  { href: "/how-it-works", label: "How it works" },
] as const;

function buildAuthedMenuLinks(role: Role | null) {
  const links: { href: string; label: string }[] = [];

  if (role === "Host") {
    links.push({ href: "/guest-directory", label: "Guests" });
  } else {
    links.push({ href: "/host-directory", label: "Hosts" });
  }

  links.push({ href: "/matches", label: "Matches" });
  links.push({ href: "/how-it-works", label: "How it works" });

  if (role === "Host") {
    links.push({ href: "/get-paid", label: "Get paid" });
  } else {
    links.push({ href: "/pay", label: "Pay" });
  }

  return links;
}

export default function Navbar() {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [isAuthed, setIsAuthed] = useState(false);
  const [profile, setProfile] = useState<NavProfile | null>(null);
  const [signingOut, setSigningOut] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const searchWrapRef = useRef<HTMLDivElement>(null);
  const mobileSearchWrapRef = useRef<HTMLDivElement>(null);
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

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      const target = event.target as Node;
      if (
        !searchWrapRef.current?.contains(target) &&
        !mobileSearchWrapRef.current?.contains(target)
      ) {
        setSearchOpen(false);
      }
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  const searchResults = useMemo(() => {
    const trimmed = searchQuery.trim();
    if (trimmed.length < 2) return [];

    const site = searchSite(trimmed, 8);
    const directoryHits: typeof site = [];

    if (isAuthed) {
      const directoryRole = profile?.role === "Host" ? "Guest" : "Host";
      directoryHits.push({
        id: "search-directory",
        title: `Search ${directoryRole === "Host" ? "hosts" : "guests"} for “${trimmed}”`,
        description: "Names, stories, and locations in the directory",
        href: directorySearchHref(directoryRole, trimmed),
        group: "Directory",
        score: 200,
      });
    } else {
      directoryHits.push({
        id: "search-hosts-signup",
        title: `Find hosts matching “${trimmed}”`,
        description: "Sign up as a guest to browse the host directory",
        href: `/login?mode=signup&role=Guest`,
        group: "Directory",
        score: 150,
      });
    }

    return [...directoryHits, ...site].slice(0, 10);
  }, [searchQuery, isAuthed, profile?.role]);

  function goToSearchResult(href: string) {
    setSearchOpen(false);
    setMenuOpen(false);
    setSearchQuery("");
    router.push(href);
  }

  function handleSearchSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (searchResults.length > 0) {
      goToSearchResult(searchResults[0].href);
      return;
    }
    const trimmed = searchQuery.trim();
    if (!trimmed) return;
    if (!isAuthed) {
      router.push(`/login?mode=signup&role=Guest`);
      return;
    }
    const directoryRole = profile?.role === "Host" ? "Guest" : "Host";
    goToSearchResult(directorySearchHref(directoryRole, trimmed));
  }

  async function handleSignOut() {
    setSigningOut(true);
    setMenuOpen(false);
    await supabase.auth.signOut();
    setIsAuthed(false);
    setProfile(null);
    router.push("/");
    router.refresh();
  }

  const menuLinks = isAuthed ? buildAuthedMenuLinks(profile?.role ?? null) : [...PUBLIC_MENU_LINKS];
  const showSearchPanel = searchOpen && searchQuery.trim().length >= 2;

  return (
    <header id="site-navbar" className="sticky top-0 z-50 border-b border-slate-200 bg-white relative">
      <div className={`w-full ${SITE_GUTTER}`}>
        <nav className="flex min-w-0 items-center gap-2 py-3 sm:gap-4 sm:py-5 lg:py-6">
          <Link href="/" className="flex min-w-0 max-w-[min(100%,70vw)] items-center gap-2 sm:max-w-none sm:gap-3">
            <span className={`${brandWordmark} min-w-0 leading-none`}>
              {BRAND_NAME}
            </span>
            <Image
              src="/images/logo.png"
              alt=""
              width={44}
              height={44}
              priority
              className="h-9 w-9 shrink-0 object-contain sm:h-11 sm:w-11"
            />
          </Link>

          <div className="ml-auto flex shrink-0 items-center justify-end gap-2 sm:gap-3">
            <form
              onSubmit={handleSearchSubmit}
              className="hidden min-w-0 xl:block xl:w-[min(100%,280px)] 2xl:w-[min(100%,360px)]"
            >
              <div ref={searchWrapRef} className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 sm:h-[1.125rem] sm:w-[1.125rem]" />
                <input
                  type="search"
                  role="combobox"
                  aria-autocomplete="list"
                  aria-haspopup="listbox"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setSearchOpen(true);
                  }}
                  onFocus={() => setSearchOpen(true)}
                  placeholder="Search pages, areas, food…"
                  aria-expanded={showSearchPanel}
                  aria-controls="site-search-results"
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-3 text-base text-slate-800 placeholder:text-slate-400 focus:border-[#002FA7] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#002FA7] sm:py-3 sm:pl-11 sm:text-lg"
                />
                {showSearchPanel ? (
                  <div
                    id="site-search-results"
                    className="absolute left-0 right-0 top-full z-50 mt-1.5 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg"
                  >
                    {searchResults.length === 0 ? (
                      <p className="px-5 py-4 text-base text-slate-500">No matches — try another word.</p>
                    ) : (
                      <ul className="max-h-[min(70vh,360px)] overflow-y-auto py-1.5">
                        {searchResults.map((result) => (
                          <li key={result.id}>
                            <button
                              type="button"
                              onClick={() => goToSearchResult(result.href)}
                              className="block w-full px-5 py-3 text-left hover:bg-[#002FA7]/5"
                            >
                              <span className="text-xs font-semibold uppercase tracking-wide text-[#002FA7]">
                                {result.group}
                              </span>
                              <span className="mt-1 block text-base font-medium text-slate-900">{result.title}</span>
                              <span className="mt-1 block text-sm leading-snug text-slate-500 line-clamp-2">
                                {result.description}
                              </span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ) : null}
              </div>
            </form>

            {!loading && !isAuthed ? (
              <div className="hidden items-center gap-3 xl:flex">
                <Link
                  href="/login"
                  className="whitespace-nowrap text-lg font-medium text-slate-700 hover:text-[#002FA7]"
                >
                  Sign In
                </Link>
                <Link
                  href="/login?mode=signup"
                  className="inline-flex items-center justify-center whitespace-nowrap rounded-lg bg-[#002FA7] px-5 py-2.5 text-lg font-medium text-white hover:bg-[#001e6c] lg:px-6 lg:py-3"
                >
                  Sign Up
                </Link>
              </div>
            ) : null}

            {isAuthed && profile ? (
              <Link href="/profile" className="shrink-0 xl:hidden">
                <span className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-slate-100 text-lg font-medium ring-1 ring-slate-200">
                  {profile.avatar_url ? (
                    <Image src={profile.avatar_url} alt="" fill sizes="40px" className="object-cover" />
                  ) : (
                    profile.full_name?.charAt(0)?.toUpperCase() ?? "?"
                  )}
                </span>
              </Link>
            ) : null}

            {isAuthed && profile ? (
              <Link href="/profile" className="hidden shrink-0 xl:block">
                <span className="relative flex h-[3.6rem] w-[3.6rem] items-center justify-center overflow-hidden rounded-full bg-slate-100 text-xl font-medium ring-1 ring-slate-200">
                  {profile.avatar_url ? (
                    <Image src={profile.avatar_url} alt="" fill sizes="58px" className="object-cover" />
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
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-700 hover:border-[#002FA7]/30 hover:text-[#002FA7] sm:h-12 sm:w-12 lg:h-14 lg:w-14"
            >
              {menuOpen ? <X className="h-7 w-7" /> : <Menu className="h-7 w-7" />}
            </button>
          </div>
        </nav>

        <form onSubmit={handleSearchSubmit} className="pb-3 pt-0 xl:hidden sm:pb-4">
          <div ref={mobileSearchWrapRef} className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              role="combobox"
              aria-autocomplete="list"
              aria-haspopup="listbox"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setSearchOpen(true);
              }}
              onFocus={() => setSearchOpen(true)}
              placeholder="Search pages, areas, food…"
              aria-expanded={showSearchPanel}
              aria-controls="site-search-results-mobile"
              className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-3 text-base focus:border-[#002FA7] focus:outline-none focus:ring-1 focus:ring-[#002FA7] sm:text-lg"
            />
            {showSearchPanel ? (
              <div
                id="site-search-results-mobile"
                className="absolute left-0 right-0 top-full z-50 mt-1.5 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg"
              >
                {searchResults.length === 0 ? (
                  <p className="px-5 py-4 text-base text-slate-500">No matches — try another word.</p>
                ) : (
                  <ul className="max-h-[min(50vh,320px)] overflow-y-auto py-1.5">
                    {searchResults.map((result) => (
                      <li key={result.id}>
                        <button
                          type="button"
                          onClick={() => goToSearchResult(result.href)}
                          className="block w-full px-5 py-3 text-left hover:bg-[#002FA7]/5"
                        >
                          <span className="text-xs font-semibold uppercase tracking-wide text-[#002FA7]">
                            {result.group}
                          </span>
                          <span className="mt-1 block text-base font-medium text-slate-900">{result.title}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ) : null}
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
            className="absolute right-5 top-full z-50 mt-1.5 w-[min(100vw-2.5rem,400px)] rounded-xl border border-slate-200 bg-white py-2 shadow-lg sm:right-7"
          >
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
              </div>
            ) : (
              <ul className="flex flex-col">
                {menuLinks.map((link) => (
                  <li key={`${link.href}-${link.label}`}>
                    <Link
                      href={link.href}
                      onClick={() => setMenuOpen(false)}
                      className="block px-5 py-4 text-lg font-medium text-slate-700 hover:bg-[#002FA7]/5 hover:text-[#002FA7]"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
                {!loading && !isAuthed ? (
                  <li className="mt-1 border-t border-slate-200 pt-1 xl:hidden">
                    <Link
                      href="/login"
                      onClick={() => setMenuOpen(false)}
                      className="block px-5 py-4 text-lg font-medium text-slate-700 hover:bg-[#002FA7]/5 hover:text-[#002FA7]"
                    >
                      Sign In
                    </Link>
                    <Link
                      href="/login?mode=signup"
                      onClick={() => setMenuOpen(false)}
                      className="block px-5 py-4 text-lg font-medium text-[#002FA7] hover:bg-[#002FA7]/5"
                    >
                      Sign Up
                    </Link>
                  </li>
                ) : null}
                {isAuthed ? (
                  <li className="mt-1 border-t border-slate-200 pt-1">
                    <button
                      type="button"
                      onClick={handleSignOut}
                      disabled={signingOut}
                      className="block w-full px-5 py-4 text-left text-lg font-medium text-slate-700 hover:bg-[#002FA7]/5 hover:text-[#002FA7] disabled:opacity-50"
                    >
                      {signingOut ? "Signing out…" : "Sign out"}
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
