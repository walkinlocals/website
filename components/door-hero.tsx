"use client";

import Link from "next/link";
import { CREAM, KLEIN_BLUE } from "@/lib/brand";

type DoorHeroProps = {
  doorHref?: string;
  userType?: "guest" | "host" | null;
  isAuthenticated?: boolean;
};

export default function DoorHero({
  doorHref,
  userType,
  isAuthenticated = false,
}: DoorHeroProps) {
  const getDestinationHref = () => {
    if (doorHref) return doorHref;

    if (!isAuthenticated) {
      return "/login";
    }

    if (userType === "guest") {
      return "/host-directory";
    }

    if (userType === "host") {
      return "/guest-directory";
    }

    return "/host-directory";
  };

  const targetHref = getDestinationHref();

  function scrollToDiscover(e: React.MouseEvent) {
    e.preventDefault();
    document.getElementById("discover")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <section
      className="relative z-10 flex min-h-[min(78vh,820px)] flex-col justify-center px-6 py-16 sm:min-h-[min(82vh,900px)] sm:py-20 lg:py-24"
      style={{ backgroundColor: CREAM }}
    >
      <div className="mx-auto w-full max-w-4xl text-center">
        <p
          className="font-sans text-sm font-semibold uppercase tracking-[0.35em] sm:text-base"
          style={{ color: KLEIN_BLUE }}
        >
          Home is where you feel loved
        </p>

        <div className="mt-12 flex flex-col items-center sm:mt-14">
          <Link
            href={targetHref}
            className="group shrink-0 rounded-lg transition-transform duration-300 hover:scale-[1.02] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#002FA7] focus-visible:ring-offset-4"
            aria-label="Open the door — sign in or discover hosts"
          >
            <img
              src="/images/logo.png"
              alt="WalkIn Locals door"
              className="h-auto w-full max-w-[min(88vw,320px)] object-contain sm:max-w-[400px] lg:max-w-[480px]"
            />
          </Link>

          <a
            href="#discover"
            onClick={scrollToDiscover}
            className="mt-10 inline-flex items-center gap-2 font-sans text-sm font-medium underline decoration-[#002fa7]/35 underline-offset-4 hover:decoration-[#002FA7] sm:mt-12"
            style={{ color: KLEIN_BLUE }}
          >
            Explore Dublin below
            <span aria-hidden>↓</span>
          </a>
        </div>
      </div>
    </section>
  );
}
