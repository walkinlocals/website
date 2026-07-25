"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import DoorHero from "@/components/door-hero";
import HomeDiscoverySections from "@/components/home-discovery-sections";
import HouseQuizTeaser from "@/components/house-quiz-teaser";
import HomeClosing from "@/components/home-closing";

export default function HomePage() {
  const supabase = createClient();
  const [isAuthed, setIsAuthed] = useState(false);
  const [userRole, setUserRole] = useState<"Host" | "Guest" | null>(null);

  useEffect(() => {
    async function checkAuth() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setIsAuthed(true);
        const { data } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .maybeSingle();
        setUserRole(data?.role ?? null);
      }
    }
    checkAuth();
  }, [supabase]);

  const doorHref = !isAuthed
    ? "/login"
    : userRole === "Host"
      ? "/guest-directory"
      : "/host-directory";

  const getCtaLink = (targetRole: "Host" | "Guest") => {
    if (!isAuthed) return `/login?mode=signup&role=${targetRole}`;
    if (userRole === "Host") return "/guest-directory";
    return "/host-directory";
  };

  return (
    <div className="relative min-h-screen w-full bg-white font-sans text-[15px] text-slate-900 antialiased sm:text-base">
      <DoorHero
        doorHref={doorHref}
        isAuthenticated={isAuthed}
        userType={userRole === "Host" ? "host" : userRole === "Guest" ? "guest" : null}
      />

      <HomeDiscoverySections />

      <HouseQuizTeaser />

      <HomeClosing
        showJoinLinks={!isAuthed}
        hostHref={getCtaLink("Host")}
        guestHref={getCtaLink("Guest")}
      />
    </div>
  );
}
