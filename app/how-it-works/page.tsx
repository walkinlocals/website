import Link from "next/link";
import { HOMEPAGE_STEPS, HOW_IT_WORKS_STEP_IMAGE_CLASS } from "@/lib/marketing-content";
import { PAGE_MAIN, PAGE_SHELL } from "@/lib/page-layout";
import {
  homeDisplayTitle,
  homeEyebrow,
  homeTextLink,
  marketingBody,
  marketingPageTitle,
  heroTitle,
} from "@/lib/homepage-ui";

const HOST_FLOW = [
  "Create your host profile and tell us about your home, neighbourhood, and what you love to share.",
  "Set your availability. You choose when your door is open.",
  "Receive connection requests from verified backpackers and accept the ones that feel right.",
  "Welcome guests for tea, coffee, and conversation, then get paid for your kindness and time.",
] as const;

const GUEST_FLOW = [
  "Browse Dublin hosts and find someone whose story speaks to you.",
  "Send a connection request with your preferred visit date and time.",
  "Pay the connection fee once your host accepts, then unlock contact details and chat.",
  "Visit their home, share the moment, and carry the memory with you.",
] as const;

export default function HowItWorksPage() {
  return (
    <div className={`${PAGE_SHELL} font-sans text-slate-950`}>
      <div className={`${PAGE_MAIN} space-y-14 sm:space-y-20`}>
        <header className="max-w-3xl">
          <Link href="/" className={`inline-flex items-center gap-2 ${homeTextLink}`}>
            ← Back home
          </Link>
          <h1 className={`mt-8 ${marketingPageTitle}`}>How It Works</h1>
        </header>

        <section className="mt-10 sm:mt-12">
          <h2 className={homeDisplayTitle}>Three simple steps</h2>
          <ul className="mt-10 space-y-14 sm:mt-12 sm:space-y-16 lg:space-y-20">
            {HOMEPAGE_STEPS.map((step, index) => {
              const { number, title, body, image } = step;
              const imageObject = "imageObject" in step ? step.imageObject : "center";
              const imageFirst = index % 2 === 0;

              return (
                <li
                  key={title}
                  className={`flex flex-col gap-8 lg:flex-row lg:items-center lg:gap-10 xl:gap-14 ${
                    imageFirst ? "" : "lg:flex-row-reverse"
                  }`}
                >
                  <div className="mx-auto w-full max-w-[84%] lg:mx-0 lg:w-[46%] lg:max-w-none lg:shrink-0">
                    <div className="overflow-hidden rounded-2xl bg-slate-200 shadow-sm ring-1 ring-slate-200/80">
                      <img
                        src={image}
                        alt=""
                        className={`${HOW_IT_WORKS_STEP_IMAGE_CLASS} ${
                          imageObject === "top" ? "object-top" : "object-center"
                        }`}
                        loading="lazy"
                        decoding="async"
                      />
                    </div>
                  </div>

                  <div className="lg:min-w-0 lg:flex-1 lg:py-2">
                    <div className="flex items-start gap-4 sm:gap-5">
                      <span
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#002FA7] font-sans text-lg font-semibold text-white sm:h-12 sm:w-12 sm:text-xl"
                        aria-hidden
                      >
                        {number}
                      </span>
                      <div>
                        <h3 className="font-sans text-2xl font-bold uppercase tracking-tight text-slate-950 sm:text-[1.75rem] lg:text-3xl">
                          {title}
                        </h3>
                        <p className="mt-4 text-lg leading-relaxed text-slate-600 sm:text-xl sm:leading-[1.65]">
                          {body}
                        </p>
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>

        <section className="border-t border-slate-200/80 pt-12 sm:pt-16 lg:pt-20">
          <div className="grid grid-cols-1 gap-14 lg:grid-cols-2 lg:gap-12 xl:gap-20">
            <div>
              <span className={homeEyebrow}>For hosts</span>
              <h2 className={`mt-4 ${heroTitle}`}>
                Hosting on your terms
              </h2>
              <ol className="mt-8 space-y-5">
                {HOST_FLOW.map((step, index) => (
                  <li key={step} className={`flex gap-4 ${marketingBody}`}>
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#002fa7]/10 font-sans text-sm font-semibold text-[#002FA7] sm:h-10 sm:w-10 sm:text-base">
                      {index + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ol>
              <Link href="/get-paid" className={`mt-10 inline-block ${homeTextLink}`}>
                Learn about host payouts →
              </Link>
            </div>

            <div className="border-t border-slate-200/80 pt-14 lg:border-l lg:border-t-0 lg:pt-0 lg:pl-12 xl:pl-20">
              <span className={homeEyebrow}>For backpackers</span>
              <h2 className={`mt-4 ${heroTitle}`}>
                Travelling with intention
              </h2>
              <ol className="mt-8 space-y-5">
                {GUEST_FLOW.map((step, index) => (
                  <li key={step} className={`flex gap-4 ${marketingBody}`}>
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#002fa7]/10 font-sans text-sm font-semibold text-[#002FA7] sm:h-10 sm:w-10 sm:text-base">
                      {index + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ol>
              <Link href="/pay" className={`mt-10 inline-block ${homeTextLink}`}>
                See connection pricing →
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
