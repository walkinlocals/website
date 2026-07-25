import Link from "next/link";
import { ABOUT_NARRATIVE } from "@/lib/marketing-content";
import {
  homeBody,
  homeContainer,
  homeDisplayTitle,
  homeEyebrow,
  homeSectionBorder,
  homeSectionY,
  homeTextLink,
} from "@/lib/homepage-ui";

type HomeClosingProps = {
  showJoinLinks: boolean;
  hostHref: string;
  guestHref: string;
};

export default function HomeClosing({ showJoinLinks, hostHref, guestHref }: HomeClosingProps) {
  return (
    <section id="narrative" className={`bg-white ${homeSectionBorder} ${homeSectionY}`}>
      <div className={homeContainer}>
        <div className="lg:grid lg:grid-cols-12 lg:items-start lg:gap-12 xl:gap-16">
          <div className="lg:col-span-6 xl:col-span-7">
            <h2 className={homeDisplayTitle}>About WalkIn Locals</h2>
            <p className="mt-6 font-serif text-xl font-light italic leading-snug text-[#002FA7] sm:text-2xl">
              {ABOUT_NARRATIVE.tagline}
            </p>
            <p className={`mt-6 max-w-xl ${homeBody}`}>
              {ABOUT_NARRATIVE.paragraphs[0]} We&apos;re building real home visits in Dublin — tea, conversation, and
              connections that last beyond the trip.
            </p>
            <Link href="/about-us" className={`mt-8 inline-block ${homeTextLink}`}>
              Read our full story →
            </Link>
          </div>

          {showJoinLinks ? (
            <div
              className="mt-14 border-t border-slate-200/90 pt-14 lg:col-span-6 lg:mt-2 lg:border-l lg:border-t-0 lg:pl-12 lg:pt-0 xl:col-span-5 xl:pl-16"
            >
              <div className="grid gap-12 sm:grid-cols-2 sm:gap-10 lg:grid-cols-1 lg:gap-14">
                <div>
                  <p className={homeEyebrow}>Hosts</p>
                  <p className="mt-3 font-serif text-2xl font-normal leading-snug text-slate-950 sm:text-[1.65rem]">
                    Host whenever you like.
                  </p>
                  <Link href={hostHref} className={`mt-4 inline-block ${homeTextLink}`}>
                    Become a Dublin Host →
                  </Link>
                </div>
                <div>
                  <p className={homeEyebrow}>Travelers</p>
                  <p className="mt-3 font-serif text-2xl font-normal italic leading-snug text-slate-950 sm:text-[1.65rem]">
                    Travel whenever you want.
                  </p>
                  <Link href={guestHref} className={`mt-4 inline-block ${homeTextLink}`}>
                    Join as a Traveler →
                  </Link>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
