import Image from "next/image";
import BrandName from "@/components/brand-name";
import DoorHero from "@/components/door-hero";
import HomeClosingWaitlist from "@/components/home-closing-waitlist";
import QuizSection from "@/components/quiz-section";
import { ABOUT_NARRATIVE, HOMEPAGE_STEPS } from "@/lib/marketing-content";
import { PAGE_SHELL } from "@/lib/page-layout";
import {
  homeBody,
  homeContainer,
  homeDisplayTitle,
  homeSectionBorder,
  homeSectionY,
} from "@/lib/homepage-ui";

export default function HomePage() {
  return (
    <div className={`${PAGE_SHELL} font-sans text-slate-900`}>
      <DoorHero doorHref="#waitlist" showComingSoon waitlistDoor />

      {/* About */}
      <section id="discover" className={`scroll-mt-24 bg-white ${homeSectionBorder} ${homeSectionY}`}>
        <div className={homeContainer}>
          <div className="lg:grid lg:grid-cols-12 lg:items-start lg:gap-12 xl:gap-16">
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
              <h2 className={homeDisplayTitle}>
                About <BrandName />
              </h2>
              <p className="font-sans text-xl font-semibold leading-snug text-[#002FA7] sm:text-2xl">
                {ABOUT_NARRATIVE.tagline}
              </p>
              <p className={homeBody}>{ABOUT_NARRATIVE.paragraphs[3]}</p>
              <p className={homeBody}>{ABOUT_NARRATIVE.paragraphs[4]}</p>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className={`bg-white ${homeSectionBorder} ${homeSectionY}`}>
        <div className={homeContainer}>
          <h2 className={homeDisplayTitle}>How it works</h2>
          <ul className="mt-10 grid gap-10 sm:grid-cols-3 sm:gap-8">
            {HOMEPAGE_STEPS.map((step) => (
              <li key={step.number}>
                <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl shadow-sm">
                  <Image
                    src={step.image}
                    alt=""
                    fill
                    sizes="(min-width: 640px) 33vw, 100vw"
                    className="object-cover"
                  />
                </div>
                <div className="mt-4 flex items-start gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#002FA7] font-sans text-sm font-semibold text-white">
                    {step.number}
                  </span>
                  <div>
                    <h3 className="font-sans text-lg font-bold text-slate-950">{step.title}</h3>
                    <p className="mt-1 text-base leading-relaxed text-slate-600">{step.body}</p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <QuizSection />

      <HomeClosingWaitlist />
    </div>
  );
}
