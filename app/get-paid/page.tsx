import Link from "next/link";
import { HOST_PAYOUT_COPY } from "@/lib/marketing-content";
import { PAGE_CONTAINER, PAGE_SHELL } from "@/lib/page-layout";
import {
  homeDisplayTitle,
  homeEyebrow,
  homePrimaryButton,
  homeSectionBorder,
  homeTextLink,
} from "@/lib/homepage-ui";

const bodyText = "font-sans text-base leading-relaxed text-slate-950 sm:text-[17px] sm:leading-[1.65]";

const PAYOUT_DETAILS = [
  {
    title: "You set the schedule",
    body: "Host whenever you like. Choose the days and times that work for your life — no pressure, no fixed commitments.",
  },
  {
    title: `€${HOST_PAYOUT_COPY.feePerGuest} per guest`,
    body: "When a traveller connects with you, you earn €25 for each person in their party. Payouts go directly to your bank via Stripe.",
  },
  {
    title: "Verified guests only",
    body: "Every traveller completes identity verification before they can send a request, so you know who is coming to your door.",
  },
  {
    title: "Simple setup",
    body: "Connect your Stripe account from your profile in minutes. We handle the payment flow — you focus on the welcome.",
  },
] as const;

export default function GetPaidPage() {
  return (
    <div className={`${PAGE_SHELL} font-sans text-slate-950`}>
      <div className={`${PAGE_CONTAINER} space-y-14 sm:space-y-16`}>
        <header className="max-w-3xl">
          <Link href="/" className={`inline-flex items-center gap-2 ${homeTextLink}`}>
            ← Back home
          </Link>
          <h1 className="mt-8 font-sans text-2xl font-bold tracking-tight sm:text-[1.875rem]">
            {HOST_PAYOUT_COPY.headline}
          </h1>
          <p className="mt-4 font-serif text-xl font-normal italic leading-snug text-slate-950 sm:text-2xl">
            Host whenever you like.
          </p>
          <p className={`mt-4 ${bodyText}`}>
            Share your home, your neighbourhood, and your stories — and earn for every genuine connection you make.
          </p>
        </header>

        <section>
          <p className={homeEyebrow}>Your earnings</p>
          <p className="mt-4 font-serif text-5xl font-normal tracking-tight text-slate-950 sm:text-6xl">
            €{HOST_PAYOUT_COPY.feePerGuest}
          </p>
          <p className={`mt-2 ${bodyText}`}>per guest, per confirmed visit</p>
        </section>

        <section>
          <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 sm:gap-12 lg:gap-14">
            {PAYOUT_DETAILS.map((item) => (
              <div key={item.title}>
                <h2 className="font-serif text-xl font-normal text-slate-950 sm:text-2xl">{item.title}</h2>
                <p className={`mt-3 ${bodyText}`}>{item.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className={`${homeSectionBorder} pt-14 sm:pt-16`}>
          <h2 className={homeDisplayTitle}>How the fee breaks down</h2>
          <p className={`mt-4 max-w-2xl ${bodyText}`}>
            Travellers pay a €{HOST_PAYOUT_COPY.connectionFee} connection fee per person. You receive €
            {HOST_PAYOUT_COPY.feePerGuest}, and €{HOST_PAYOUT_COPY.platformFee} covers verification, payments, and keeping{" "}
            <span className="text-[#002FA7]">WalkIn Locals</span> running.
          </p>
          <Link href="/login?mode=signup&role=Host" className={`mt-8 ${homePrimaryButton}`}>
            Start hosting in Dublin
          </Link>
        </section>
      </div>
    </div>
  );
}
