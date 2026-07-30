"use client";

import { useWaitlistModal } from "@/components/waitlist-modal-provider";
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
    <section
      id="waitlist"
      className={`scroll-mt-24 bg-white ${homeSectionBorder} ${homeSectionY}`}
    >
      <div className={homeContainer}>
        <h2 className={homeDisplayTitle}>Be first through the door</h2>
        <p className="mt-4 max-w-2xl font-sans text-lg leading-relaxed text-slate-600 sm:text-xl">
          We&apos;re launching in Dublin soon. Join the waitlist and we&apos;ll let you know the
          moment doors open.
        </p>

        <div className="mt-10 grid gap-10 sm:grid-cols-2 sm:gap-14">
          <div>
            <p className={homeEyebrow}>Hosts</p>
            <p className="mt-3 font-sans text-2xl font-semibold uppercase leading-snug text-slate-950 sm:text-[1.65rem]">
              A place at our table.
            </p>
            <p className="mt-2 text-base text-slate-600">
              Get paid for every guest you welcome.
            </p>
            <button
              type="button"
              onClick={() => openWaitlistModal("Host")}
              className={`mt-4 inline-block ${homeTextLink}`}
            >
              Join the Host waitlist →
            </button>
          </div>
          <div>
            <p className={homeEyebrow}>Backpackers</p>
            <p className="mt-3 font-sans text-2xl font-semibold uppercase leading-snug text-slate-950 sm:text-[1.65rem]">
              Doors unlock soon.
            </p>
            <button
              type="button"
              onClick={() => openWaitlistModal("Guest")}
              className={`mt-4 inline-block ${homeTextLink}`}
            >
              Join the Guest waitlist →
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
