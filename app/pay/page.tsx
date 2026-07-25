import Link from "next/link";
import { GUEST_PAY_COPY } from "@/lib/marketing-content";
import { MAX_PARTY_SIZE } from "@/lib/pricing";
import { PAGE_CONTAINER, PAGE_SHELL } from "@/lib/page-layout";
import {
  homeDisplayTitle,
  homeEyebrow,
  homePrimaryButton,
  homeSectionBorder,
  homeTextLink,
} from "@/lib/homepage-ui";

const bodyText = "font-sans text-base leading-relaxed text-slate-950 sm:text-[17px] sm:leading-[1.65]";

const PAY_DETAILS = [
  {
    title: "One clear fee",
    body: `€${GUEST_PAY_COPY.feePerGuest} per person covers your connection to a verified Dublin host — no hidden charges, no subscriptions.`,
  },
  {
    title: "Pay when it feels right",
    body: "Browse hosts for free. You only pay once your host accepts your connection request and you're ready to meet.",
  },
  {
    title: "Unlock real contact",
    body: "After payment, you get the host's phone number, email, and in-app chat so you can coordinate your visit.",
  },
  {
    title: "Bring your people",
    body: `Travelling with friends or family? Add up to ${MAX_PARTY_SIZE} guests to a single connection request.`,
  },
] as const;

export default function PayPage() {
  return (
    <div className={`${PAGE_SHELL} font-sans text-slate-950`}>
      <div className={`${PAGE_CONTAINER} space-y-14 sm:space-y-16`}>
        <header className="max-w-3xl">
          <Link href="/" className={`inline-flex items-center gap-2 ${homeTextLink}`}>
            ← Back home
          </Link>
          <h1 className="mt-8 font-sans text-2xl font-bold tracking-tight sm:text-[1.875rem]">
            {GUEST_PAY_COPY.headline}
          </h1>
          <p className="mt-4 font-serif text-xl font-normal italic leading-snug text-slate-950 sm:text-2xl">
            Travel whenever you want.
          </p>
          <p className={`mt-4 ${bodyText}`}>
            Discover Dublin through the homes and hearts of people who live here — not as a tourist, but as a welcomed
            guest.
          </p>
        </header>

        <section>
          <p className={homeEyebrow}>Connection fee</p>
          <p className="mt-4 font-serif text-5xl font-normal tracking-tight text-slate-950 sm:text-6xl">
            €{GUEST_PAY_COPY.feePerGuest}
          </p>
          <p className={`mt-2 ${bodyText}`}>per person, per visit</p>
        </section>

        <section>
          <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 sm:gap-12 lg:gap-14">
            {PAY_DETAILS.map((item) => (
              <div key={item.title}>
                <h2 className="font-serif text-xl font-normal text-slate-950 sm:text-2xl">{item.title}</h2>
                <p className={`mt-3 ${bodyText}`}>{item.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className={`${homeSectionBorder} pt-14 sm:pt-16`}>
          <h2 className={homeDisplayTitle}>Where your payment goes</h2>
          <p className={`mt-4 max-w-2xl ${bodyText}`}>
            €{GUEST_PAY_COPY.hostShare} goes directly to your host. The remainder covers identity verification, secure
            payments, and keeping <span className="text-[#002FA7]">WalkIn Locals</span> running so we can grow this
            community thoughtfully.
          </p>
          <Link href="/login?mode=signup&role=Guest" className={`mt-8 ${homePrimaryButton}`}>
            Find a Dublin host
          </Link>
        </section>
      </div>
    </div>
  );
}
