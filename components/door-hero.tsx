"use client";

import Image from "next/image";
import Link from "next/link";
import { SITE_GUTTER } from "@/lib/page-layout";
import { BRAND_NAME, heroTitle } from "@/lib/homepage-ui";
import { CREAM } from "@/lib/brand";

type DoorHeroProps = {
  doorHref?: string;
  userType?: "guest" | "host" | null;
  isAuthenticated?: boolean;
  showComingSoon?: boolean;
  /** Door opens waitlist section instead of sign-in (pre-launch site). */
  waitlistDoor?: boolean;
};

export default function DoorHero({
  doorHref,
  userType,
  isAuthenticated = false,
  showComingSoon = false,
  waitlistDoor = false,
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
  const isHashLink = targetHref.startsWith("#");

  function scrollToDiscover(e: React.MouseEvent) {
    e.preventDefault();
    document
      .getElementById("discover")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function scrollToHash(e: React.MouseEvent) {
    e.preventDefault();
    const id = targetHref.replace("#", "");
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const doorLabel = waitlistDoor
    ? "Open the door — join the waitlist"
    : "Open the door — sign in or discover hosts";

  const doorImage = (
    <Image
      src="/images/logo.png"
      alt={`${BRAND_NAME} door`}
      width={434}
      height={440}
      priority
      className="h-auto w-[min(92vw,20rem)] max-h-[min(50vh,26rem)] object-contain sm:w-[min(88vw,28rem)] sm:max-h-[min(55vh,32rem)] lg:w-[min(36rem,42vw)] xl:w-[min(42rem,38vw)]"
    />
  );

  return (
    <section
      className={`relative z-10 flex min-h-[min(64vh,720px)] flex-col justify-center py-10 sm:min-h-[min(72vh,880px)] sm:py-16 lg:py-20 ${SITE_GUTTER}`}
      style={{ backgroundColor: CREAM }}
    >
      {showComingSoon ? (
        <div
          className="pointer-events-none absolute inset-x-0 top-6 overflow-hidden sm:top-10"
          aria-hidden
        >
          <div className="flex w-max animate-coming-soon-marquee gap-16 whitespace-nowrap px-4">
            {[0, 1].map((copy) => (
              <span
                key={copy}
                className="font-serif text-[clamp(2.5rem,8vw,5.5rem)] font-normal uppercase tracking-[0.12em] text-[#002FA7]/12"
              >
                Coming soon · Coming soon · Coming soon · Coming soon ·
              </span>
            ))}
          </div>
        </div>
      ) : null}

      <div className="mx-auto flex w-full flex-col items-center text-center">
        {showComingSoon ? (
          <p
            className="animate-coming-soon-float font-serif text-[clamp(1.75rem,5vw,3.25rem)] font-normal uppercase tracking-[0.18em] text-[#002FA7] mb-4 sm:mb-6"
          >
            Coming soon
          </p>
        ) : null}

        <p className={`${heroTitle} px-1`}>Home is where you feel loved</p>

        <div className="mt-8 flex flex-col items-center sm:mt-12 lg:mt-14">
          {isHashLink ? (
            <a
              href={targetHref}
              onClick={scrollToHash}
              className="group shrink-0 rounded-lg transition-transform duration-300 hover:scale-[1.02] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#002FA7] focus-visible:ring-offset-4"
              aria-label={doorLabel}
            >
              {doorImage}
            </a>
          ) : (
            <Link
              href={targetHref}
              className="group shrink-0 rounded-lg transition-transform duration-300 hover:scale-[1.02] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#002FA7] focus-visible:ring-offset-4"
              aria-label={doorLabel}
            >
              {doorImage}
            </Link>
          )}

          <a
            href="#discover"
            onClick={scrollToDiscover}
            className="mt-8 inline-flex items-center gap-2.5 font-sans text-base font-medium text-[#002FA7] underline decoration-[#002fa7]/35 underline-offset-4 hover:decoration-[#002FA7] sm:mt-10 sm:text-lg lg:text-xl"
          >
            Explore Dublin below
            <span className="text-xl sm:text-2xl" aria-hidden>
              ↓
            </span>
          </a>
        </div>
      </div>
    </section>
  );
}
