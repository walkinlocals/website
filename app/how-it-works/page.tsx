import Image from "next/image";
import Link from "next/link";
import { HOMEPAGE_STEPS, HOW_IT_WORKS_STEP_IMAGE_CLASS } from "@/lib/marketing-content";
import { PAGE_MAIN, PAGE_SHELL } from "@/lib/page-layout";
import {
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

        <section>
          <ul className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8">
            {HOMEPAGE_STEPS.map((step) => {
              const { number, title, body, image } = step;
              const imageObject = "imageObject" in step ? step.imageObject : "center";

              return (
                <li
                  key={title}
                  className="group overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className={`relative bg-slate-200 ${HOW_IT_WORKS_STEP_IMAGE_CLASS}`}>
                    <Image
                      src={image}
                      alt=""
                      fill
                      sizes="(min-width: 1024px) 31vw, (min-width: 640px) 46vw, 92vw"
                      className={`object-cover ${
                        imageObject === "top" ? "object-top" : "object-center"
                      }`}
                    />
                  </div>

                  <div className="p-6 lg:p-7">
                    <h3 className="flex items-start gap-3 font-sans text-xl font-bold uppercase tracking-tight text-slate-950 sm:text-2xl">
                      <span
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#002FA7] font-sans text-base font-semibold text-white shadow-sm shadow-[#002FA7]/25"
                        aria-hidden
                      >
                        {number}
                      </span>
                      {title}
                    </h3>
                    <p className="mt-3 text-base leading-relaxed text-slate-600 sm:text-lg">
                      {body}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>

        <section className="border-t border-slate-200/80 pt-12 sm:pt-16 lg:pt-20">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-10">
            <div className="rounded-2xl border border-slate-200/80 p-8 shadow-sm lg:p-10">
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

            <div className="rounded-2xl border border-slate-200/80 p-8 shadow-sm lg:p-10">
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
