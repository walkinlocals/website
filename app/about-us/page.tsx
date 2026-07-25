import Link from "next/link";
import { ABOUT_NARRATIVE } from "@/lib/marketing-content";
import { PAGE_CONTAINER, PAGE_SHELL } from "@/lib/page-layout";
import { homeEyebrow, homeSectionBorder, homeTextLink } from "@/lib/homepage-ui";

const bodyText = "font-sans text-base leading-relaxed text-slate-950 sm:text-[17px] sm:leading-[1.65]";

export default function AboutUsPage() {
  return (
    <div className={`${PAGE_SHELL} font-sans text-slate-950`}>
      <section className="bg-white pb-14 sm:pb-20">
        <div className={PAGE_CONTAINER}>
          <Link
            href="/"
            className="inline-flex items-center gap-2 font-sans text-sm font-medium text-[#002FA7] underline decoration-[#002FA7]/35 underline-offset-4 hover:decoration-[#002FA7]"
          >
            ← Back home
          </Link>
          <h1 className="mt-8 font-sans text-2xl font-bold tracking-tight sm:text-[1.875rem]">About Us</h1>
          <p className={`mt-4 max-w-2xl ${bodyText}`}>
            <span className="text-[#002FA7]">Home is where you feel loved</span> — and we&apos;re building a way to share
            that feeling across <span className="text-[#002FA7]">Dublin</span> and beyond.
          </p>

          <div className="mt-12 lg:grid lg:grid-cols-12 lg:items-start lg:gap-12 xl:mt-16 xl:gap-16">
            <div className="lg:col-span-5">
              <img
                src="/images/mugs.jpg"
                alt=""
                className="w-full rounded-xl object-cover"
                loading="eager"
                decoding="async"
              />
            </div>

            <div className="mt-10 space-y-6 lg:col-span-7 lg:mt-0">
              <p className={bodyText}>
                <span className="text-[#002FA7]">WalkIn Locals</span> started with a simple conversation between the three
                of us.
              </p>
              <p className={`${bodyText} italic`}>{ABOUT_NARRATIVE.paragraphs[1]}</p>
              <p className={bodyText}>
                That&apos;s how <span className="text-[#002FA7]">WalkIn Locals</span> was born.
              </p>
              <p className={bodyText}>
                Together, we&apos;re building a community that brings travellers and local hosts together through{" "}
                <span className="text-[#002FA7]">real home visits</span>, where a cup of tea or coffee, a homemade local
                treat, and a good conversation become part of the journey.
              </p>
              <p className={bodyText}>
                We&apos;re starting in <span className="text-[#002FA7]">Dublin</span>, where we live. Our mission is to
                create <span className="text-[#002FA7]">meaningful connections</span> between people around the world,
                because <span className="italic text-[#002FA7]">home is where you feel loved.</span>
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className={`${homeSectionBorder} bg-white py-14 sm:py-20`}>
        <div className={PAGE_CONTAINER}>
          <h2 className="font-sans text-2xl font-bold tracking-tight text-slate-950 sm:text-[1.75rem]">
            Ready to join us?
          </h2>
          <p className={`mt-3 max-w-xl ${bodyText}`}>
            Whether you want to open your door or walk through someone else&apos;s, there&apos;s a place for you here.
          </p>

          <div className="mt-12 grid gap-12 sm:grid-cols-2 sm:gap-10 lg:gap-16">
            <div>
              <p className={homeEyebrow}>Hosts</p>
              <p className="mt-3 font-serif text-2xl font-normal leading-snug text-slate-950 sm:text-[1.65rem]">
                Host whenever you like.
              </p>
              <Link href="/login?mode=signup&role=Host" className={`mt-4 inline-block ${homeTextLink}`}>
                Become a Dublin Host →
              </Link>
            </div>
            <div>
              <p className={homeEyebrow}>Travelers</p>
              <p className="mt-3 font-serif text-2xl font-normal italic leading-snug text-slate-950 sm:text-[1.65rem]">
                Travel whenever you want.
              </p>
              <Link href="/login?mode=signup&role=Guest" className={`mt-4 inline-block ${homeTextLink}`}>
                Join as a Traveler →
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
