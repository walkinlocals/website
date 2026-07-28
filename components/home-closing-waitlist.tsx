"use client";

import Link from "next/link";
import BrandName from "@/components/brand-name";
import { useWaitlistModal } from "@/components/waitlist-modal-provider";
import { ABOUT_NARRATIVE } from "@/lib/marketing-content";
import {
  homeContainer,
  homeDisplayTitle,
  homeEyebrow,
  homeSectionBorder,
  homeSectionY,
  homeTextLink,
} from "@/lib/homepage-ui";

export default function HomeClosingWaitlist() {
  const { openWaitlistModal } = useWaitlistModal();

  return (
    <section id="narrative" className={`bg-white ${homeSectionBorder} ${homeSectionY}`}>
      <div className={homeContainer}>
        <div className="lg:grid lg:grid-cols-12 lg:items-start lg:gap-12 xl:gap-16">
          <div className="lg:col-span-6 xl:col-span-7">
            <h2 className={homeDisplayTitle}>About <BrandName /></h2>
            <p className="mt-6 font-serif text-xl font-light italic leading-snug text-[#002FA7] sm:text-2xl">
              {ABOUT_NARRATIVE.tagline}
            </p>
            <Link href="/about-us" className={`mt-8 inline-block ${homeTextLink}`}>
              Read our full story →
            </Link>
          </div>

          <div
            id="waitlist"
            className="scroll-mt-24 mt-14 border-t border-slate-200/90 pt-14 lg:col-span-6 lg:mt-2 lg:border-l lg:border-t-0 lg:pl-12 lg:pt-0 xl:col-span-5 xl:pl-16"
          >
            <div className="grid gap-10 md:grid-cols-2 md:gap-10 lg:grid-cols-1 lg:gap-14">
              <div>
                <p className={homeEyebrow}>Hosts</p>
                <p className="mt-3 font-serif text-2xl font-normal uppercase leading-snug text-slate-950 sm:text-[1.65rem]">
                  A place at our table.
                </p>
                <button
                  type="button"
                  onClick={() => openWaitlistModal("Host")}
                  className={`mt-4 inline-block ${homeTextLink}`}
                >
                  Become a Dublin Host Waitlist →
                </button>
              </div>
              <div>
                <p className={homeEyebrow}>Backpackers</p>
                <p className="mt-3 font-serif text-2xl font-normal uppercase italic leading-snug text-slate-950 sm:text-[1.65rem]">
                  Doors unlock soon.
                </p>
                <button
                  type="button"
                  onClick={() => openWaitlistModal("Guest")}
                  className={`mt-4 inline-block ${homeTextLink}`}
                >
                  Join as a Backpacker Waitlist →
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
