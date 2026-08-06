import Link from "next/link";
import { HOST_PAYOUT_COPY } from "@/lib/marketing-content";
import { PAGE_MAIN, PAGE_SHELL } from "@/lib/page-layout";
import {
  homeDisplayTitle,
  homePrimaryButton,
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
    body: "When a backpacker connects with you, you earn €15 for each person in their party. Payouts go directly to your bank.",
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
          <ol className="grid gap-5 sm:grid-cols-2 sm:gap-6">
            {PAYOUT_DETAILS.map((item, index) => (
              <li
                key={item.title}
                className="flex gap-4 rounded-2xl border border-slate-200/80 p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:gap-5 sm:p-7"
              >
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
            <Link href="/login?mode=signup&role=Host" className={homePrimaryButton}>
              Start hosting in Dublin
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
