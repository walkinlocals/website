import Link from "next/link";
import { GUEST_PAY_COPY } from "@/lib/marketing-content";
import { MAX_PARTY_SIZE } from "@/lib/pricing";
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

const payStepTitle = `${siteTitleTypography} text-xl sm:text-2xl`;

const PAY_DETAILS = [
  {
    title: "One clear fee",
    body: `€${GUEST_PAY_COPY.feePerGuest} per person covers your connection to a verified Dublin host. No hidden charges, no subscriptions.`,
  },
  {
    title: "Pay when it feels right",
    body: "Browse hosts for free. You only pay once your host accepts your connection request and you are ready to meet.",
  },
  {
    title: "Unlock real contact",
    body: "After payment, you get the host's phone number, email, and in app chat so you can coordinate your visit.",
  },
  {
    title: "Bring your people",
    body: `Visiting with friends or family? Add up to ${MAX_PARTY_SIZE} guests to a single connection request.`,
  },
] as const;

export default function PayPage() {
  return (
    <div className={`${PAGE_SHELL} font-sans text-slate-950`}>
      <div className={`${PAGE_MAIN} space-y-14 sm:space-y-20`}>
        <header className="max-w-3xl">
          <Link href="/" className={`inline-flex items-center gap-2 ${homeTextLink}`}>
            ← Back home
          </Link>
          <h1 className={`mt-8 ${marketingPageTitle}`}>
            {GUEST_PAY_COPY.headline}
          </h1>
          <p className={`mt-5 ${marketingBody}`}>
            Discover Dublin through the homes and hearts of people who live here. You are a welcomed guest, not just a
            tourist.
          </p>
        </header>

        <section className="text-center">
          <p className={homeDisplayTitle}>Connection fee</p>
          <div className={marketingFeeCircle}>
            <span className={marketingFeeAmount}>
              €{GUEST_PAY_COPY.feePerGuest}
            </span>
          </div>
          <p className={marketingFeePerLabel}>
            per person
          </p>
        </section>

        <section>
          <ol className="space-y-8 sm:space-y-10">
            {PAY_DETAILS.map((item, index) => (
              <li key={item.title} className="flex gap-4 sm:gap-5">
                <span
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#002fa7]/10 font-sans text-lg font-semibold text-[#002FA7] sm:h-12 sm:w-12 sm:text-xl"
                  aria-hidden
                >
                  {index + 1}
                </span>
                <div className="min-w-0 pt-0.5">
                  <p className={payStepTitle}>
                    {item.title}
                  </p>
                  <p className={`mt-3 ${marketingBody}`}>{item.body}</p>
                </div>
              </li>
            ))}
          </ol>
          <div className="mt-12 flex justify-center">
            <WaitlistPrimaryCta role="Guest" label="Find a Dublin host" />
          </div>
        </section>
      </div>
    </div>
  );
}
