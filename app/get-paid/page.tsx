import Link from "next/link";
import { HOST_PAYOUT_COPY } from "@/lib/marketing-content";
import { PAGE_MAIN, PAGE_SHELL } from "@/lib/page-layout";
import { WaitlistPrimaryCta } from "@/components/waitlist-marketing-ctas";
import {
  homeDisplayTitle,
  homeTextLink,
  marketingBody,
  marketingFeeAmount,
  marketingFeeCircle,
  marketingFeePerLabel,
  marketingPageTitle,
  siteTitleTypography,
} from "@/lib/homepage-ui";

const hostStepTitle = `${siteTitleTypography} text-xl sm:text-2xl`;

const PAYOUT_DETAILS = [
  {
    title: "You set the schedule",
    body: "Host whenever you like. Choose the days and times that work for your life. No pressure, no fixed commitments.",
  },
  {
    title: `€${HOST_PAYOUT_COPY.feePerGuest} per guest`,
    body: "When a backpacker connects with you, you earn €25 for each person in their party. Payouts go directly to your bank.",
  },
  {
    title: "Verified guests only",
    body: "Every backpacker completes identity verification before they can send a request, so you know who is coming to your door.",
  },
  {
    title: "Simple setup",
    body: "Connect your bank details from your profile in minutes. We handle the payment flow. You focus on the welcome.",
  },
] as const;

export default function GetPaidPage() {
  return (
    <div className={`${PAGE_SHELL} font-sans text-slate-950`}>
      <div className={`${PAGE_MAIN} space-y-14 sm:space-y-20`}>
        <header className="max-w-3xl">
          <Link href="/" className={`inline-flex items-center gap-2 ${homeTextLink}`}>
            ← Back home
          </Link>
          <h1 className={`mt-8 ${marketingPageTitle}`}>
            {HOST_PAYOUT_COPY.headline}
          </h1>
          <p className={`mt-5 ${marketingBody}`}>
            Share your home, your neighbourhood, and your stories. Earn for every genuine connection you make.
          </p>
        </header>

        <section className="text-center">
          <p className={homeDisplayTitle}>Your earnings</p>
          <div className={marketingFeeCircle}>
            <span className={marketingFeeAmount}>
              €{HOST_PAYOUT_COPY.feePerGuest}
            </span>
          </div>
          <p className={marketingFeePerLabel}>per guest</p>
        </section>

        <section>
          <ol className="space-y-8 sm:space-y-10">
            {PAYOUT_DETAILS.map((item, index) => (
              <li key={item.title} className="flex gap-4 sm:gap-5">
                <span
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#002fa7]/10 font-sans text-lg font-semibold text-[#002FA7] sm:h-12 sm:w-12 sm:text-xl"
                  aria-hidden
                >
                  {index + 1}
                </span>
                <div className="min-w-0 pt-0.5">
                  <p className={hostStepTitle}>
                    {item.title}
                  </p>
                  <p className={`mt-3 ${marketingBody}`}>{item.body}</p>
                </div>
              </li>
            ))}
          </ol>
          <div className="mt-12 flex justify-center">
            <WaitlistPrimaryCta role="Host" label="Start hosting in Dublin" />
          </div>
        </section>
      </div>
    </div>
  );
}
