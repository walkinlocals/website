import Link from "next/link";
import { HOMEPAGE_STEPS } from "@/lib/marketing-content";
import { PAGE_CONTAINER, PAGE_SHELL } from "@/lib/page-layout";
import { homeDisplayTitle, homeEyebrow, homeTextLink } from "@/lib/homepage-ui";

const bodyText = "font-sans text-base leading-relaxed text-slate-950 sm:text-[17px] sm:leading-[1.65]";

const HOST_FLOW = [
  "Create your host profile and tell us about your home, neighbourhood, and what you love to share.",
  "Set your availability — you choose when your door is open.",
  "Receive connection requests from verified travellers and accept the ones that feel right.",
  "Welcome guests for tea, coffee, and conversation — then get paid through Stripe.",
] as const;

const GUEST_FLOW = [
  "Browse Dublin hosts and find someone whose story speaks to you.",
  "Send a connection request with your preferred visit date and time.",
  "Pay the connection fee once your host accepts — then unlock contact details and chat.",
  "Visit their home, share the moment, and carry the memory with you.",
] as const;

export default function HowItWorksPage() {
  return (
    <div className={`${PAGE_SHELL} font-sans text-slate-950`}>
      <div className={`${PAGE_CONTAINER} space-y-14 sm:space-y-16`}>
        <header className="max-w-3xl">
          <Link href="/" className={`inline-flex items-center gap-2 ${homeTextLink}`}>
            ← Back home
          </Link>
          <h1 className="mt-8 font-sans text-2xl font-bold tracking-tight sm:text-[1.875rem]">How It Works</h1>
          <p className={`mt-4 ${bodyText}`}>
            WalkIn Locals connects travellers with Dublin hosts for real home visits — not tours, but genuine moments
            shared over tea, coffee, and conversation.
          </p>
        </header>

        <section>
          <h2 className={homeDisplayTitle}>Three simple steps</h2>
          <div className="mt-10 grid grid-cols-1 gap-10 sm:gap-12 md:grid-cols-3 md:gap-8 lg:gap-10">
            {HOMEPAGE_STEPS.map(({ number, title, body }) => (
              <div key={title}>
                <p className={homeEyebrow}>{number}</p>
                <h3 className="mt-3 font-serif text-xl font-normal leading-snug text-slate-950 sm:text-2xl">{title}</h3>
                <p className={`mt-3 ${bodyText}`}>{body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="border-t border-slate-200/80 pt-14 sm:pt-16">
          <div className="grid grid-cols-1 gap-14 lg:grid-cols-2 lg:gap-12 xl:gap-16">
            <div>
              <span className={homeEyebrow}>For hosts</span>
              <h2 className="mt-3 font-serif text-2xl font-normal text-slate-950">Hosting on your terms</h2>
              <ol className="mt-6 space-y-4">
                {HOST_FLOW.map((step, index) => (
                  <li key={step} className={`flex gap-4 ${bodyText}`}>
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#002fa7]/10 font-sans text-xs font-semibold text-[#002FA7]">
                      {index + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ol>
              <Link href="/get-paid" className={`mt-8 inline-block ${homeTextLink}`}>
                Learn about host payouts →
              </Link>
            </div>

            <div className="border-t border-slate-200/80 pt-14 lg:border-l lg:border-t-0 lg:pt-0 lg:pl-12 xl:pl-16">
              <span className={homeEyebrow}>For travellers</span>
              <h2 className="mt-3 font-serif text-2xl font-normal text-slate-950">Travelling with intention</h2>
              <ol className="mt-6 space-y-4">
                {GUEST_FLOW.map((step, index) => (
                  <li key={step} className={`flex gap-4 ${bodyText}`}>
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#002fa7]/10 font-sans text-xs font-semibold text-[#002FA7]">
                      {index + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ol>
              <Link href="/pay" className={`mt-8 inline-block ${homeTextLink}`}>
                See connection pricing →
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
