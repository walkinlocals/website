import Image from "next/image";
import Link from "next/link";
import BrandName from "@/components/brand-name";
import { ABOUT_NARRATIVE } from "@/lib/marketing-content";
import { PAGE_CONTAINER, PAGE_MAIN, PAGE_SHELL } from "@/lib/page-layout";
import {
  homeDisplayTitle,
  homeEyebrow,
  homeSectionBorder,
  homeTextLink,
  marketingBody,
  marketingPageTitle,
  heroTitle,
  brandWordmark,
} from "@/lib/homepage-ui";

export default function AboutUsPage() {
  return (
    <div className={`${PAGE_SHELL} font-sans text-slate-950`}>
      <section className="bg-white">
        <div className={PAGE_MAIN}>
          <Link href="/" className={`inline-flex items-center gap-2 ${homeTextLink}`}>
            ← Back home
          </Link>
          <h1 className={`mt-8 ${marketingPageTitle}`}>About Us</h1>

          <div className="mt-12 lg:grid lg:grid-cols-12 lg:items-start lg:gap-12 xl:mt-16 xl:gap-20">
            <div className="lg:col-span-5">
              <Image
                src="/images/mugs.jpg"
                alt=""
                width={3508}
                height={2480}
                priority
                className="h-auto w-full rounded-xl object-cover"
              />
            </div>

            <div className="mt-10 space-y-6 lg:col-span-7 lg:mt-0">
              <p className={marketingBody}>
                <span className={brandWordmark}>Home is where you feel loved</span> and we&apos;re building a way to
                share that feeling across <span className="font-semibold text-[#002FA7]">Dublin</span> and beyond.
              </p>
              <p className="border-l-2 border-[#002FA7]/30 pl-5 font-serif text-xl italic leading-relaxed text-slate-950 sm:text-2xl sm:leading-relaxed">
                {ABOUT_NARRATIVE.paragraphs[1]}
              </p>
              <p className={marketingBody}>
                That&apos;s how <BrandName /> was born.
              </p>
              <p className={marketingBody}>
                Together, we&apos;re building a community that brings backpackers and local hosts together through{" "}
                <span className="text-[#002FA7]">real home visits</span>, where a cup of tea or coffee, a homemade local
                treat, and a good conversation become part of the journey.
              </p>
              <p className={marketingBody}>
                We&apos;re starting in <span className="text-[#002FA7]">Dublin</span>, where we live. Our mission is to
                create <span className="text-[#002FA7]">meaningful connections</span> between people around the world,
                because <span className="italic text-[#002FA7]">home is where you feel loved.</span>
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className={`${homeSectionBorder} bg-white`}>
        <div className={`${PAGE_CONTAINER} py-14 sm:py-20 lg:py-24`}>
          <h2 className={homeDisplayTitle}>Ready to join us?</h2>
          <p className={`mt-5 max-w-3xl ${marketingBody}`}>
            Whether you want to open your door or walk through someone else&apos;s, there&apos;s a place for you here.
          </p>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 sm:gap-8">
            <div className="rounded-2xl border border-slate-200/80 p-8 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md lg:p-10">
              <p className={homeEyebrow}>Hosts</p>
              <p className={`mt-4 ${heroTitle}`}>
                Host whenever you like.
              </p>
              <Link href="/login?mode=signup&role=Host" className={`mt-6 inline-block ${homeTextLink}`}>
                Become a Dublin Host →
              </Link>
            </div>
            <div className="rounded-2xl border border-slate-200/80 p-8 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md lg:p-10">
              <p className={homeEyebrow}>Backpackers</p>
              <p className={`mt-4 ${heroTitle} italic`}>
                Travel whenever you want.
              </p>
              <Link href="/login?mode=signup&role=Guest" className={`mt-6 inline-block ${homeTextLink}`}>
                Join as a Backpacker →
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
