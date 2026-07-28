"use client";

import Link from "next/link";
import { useState } from "react";
import ContactModal from "@/components/contact-modal";
import { SITE_GUTTER } from "@/lib/page-layout";
import { brandWordmark, BRAND_NAME, siteTitleSm } from "@/lib/homepage-ui";

/* Official payment mark SVGs in public/images/payments */

const PAYMENT_BADGES = [
  { src: "/images/payments/master.svg", label: "Mastercard" },
  { src: "/images/payments/visa.svg", label: "Visa" },
  { src: "/images/payments/amex.png", label: "American Express" },
  { src: "/images/payments/apple_pay.svg", label: "Apple Pay" },
  { src: "/images/payments/google_pay.svg", label: "Google Pay" },
  { src: "/images/payments/stripe.svg", label: "Stripe" },
] as const;

function PaymentAcceptRow() {
  return (
    <div className="flex flex-wrap items-center gap-3">
      {PAYMENT_BADGES.map((badge) => {
        const isAmex = badge.label === "American Express";

        return (
          <img
            key={badge.label}
            src={badge.src}
            alt={badge.label}
            className={`h-8 w-12 shrink-0 aspect-[3/2] object-contain object-center sm:h-9 sm:w-14 ${
              isAmex ? "scale-x-125 scale-y-105" : ""
            }`}
            loading="lazy"
            decoding="async"
          />
        );
      })}
    </div>
  );
}

function FooterColumn({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h3 className={siteTitleSm}>{title}</h3>
      <ul className="mt-4 space-y-3 text-base text-slate-600 sm:text-lg">{children}</ul>
    </div>
  );
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <li>
      <Link href={href} className="transition hover:text-[#002FA7] hover:underline">
        {children}
      </Link>
    </li>
  );
}

export default function SiteFooter() {
  const [contactOpen, setContactOpen] = useState(false);

  return (
    <>
      <footer className="border-t border-slate-200/80 bg-[#faf9f6] text-slate-700">
        <div className={`w-full pt-14 pb-14 sm:pt-16 sm:pb-16 ${SITE_GUTTER}`}>
          <div className="flex flex-col gap-6 border-b border-slate-200/80 pb-10 sm:flex-row sm:items-center sm:justify-between">
            <Link href="/" className="flex shrink-0 items-center gap-3">
              <span className={brandWordmark}>
                {BRAND_NAME}
              </span>
              <img src="/images/logo.png" alt={BRAND_NAME} className="h-10 w-10 object-contain sm:h-11 sm:w-11" />
            </Link>
            <button
              type="button"
              onClick={() => setContactOpen(true)}
              className="rounded-lg border border-slate-200 bg-white px-5 py-2.5 text-base font-medium text-slate-700 shadow-sm hover:border-[#002FA7]/30 hover:text-[#002FA7] sm:text-lg"
            >
              Contact us
            </button>
          </div>

          <div className="mt-10 grid grid-cols-2 gap-10 md:grid-cols-3 lg:grid-cols-6">
            <FooterColumn title={`About ${BRAND_NAME}`}>
              <FooterLink href="/about-us">Our story</FooterLink>
              <FooterLink href="/how-it-works">How it works</FooterLink>
              <FooterLink href="/terms">Terms &amp; conditions</FooterLink>
            </FooterColumn>

            <FooterColumn title="Guests">
              <FooterLink href="/pay">Connection pricing</FooterLink>
              <FooterLink href="/#waitlist">Join guest waitlist</FooterLink>
              <FooterLink href="/terms">Guest policies</FooterLink>
            </FooterColumn>

            <FooterColumn title="Hosts">
              <FooterLink href="/get-paid">Host payouts</FooterLink>
              <FooterLink href="/#waitlist">Join host waitlist</FooterLink>
              <FooterLink href="/terms">Host policies</FooterLink>
            </FooterColumn>

            <FooterColumn title="Follow us">
              <li>
                <a
                  href="https://www.instagram.com/walkinlocals/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition hover:text-[#002FA7] hover:underline"
                >
                  Instagram
                </a>
              </li>
            </FooterColumn>

            <div className="col-span-2 lg:col-span-2">
              <h3 className={siteTitleSm}>We accept</h3>

              <div className="mt-4">
                <PaymentAcceptRow />
              </div>

              <p className="mt-3 text-sm font-light text-slate-500 sm:text-base">
                Secure payments via Stripe. Availability may vary by region.
              </p>
            </div>
          </div>

          <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-slate-200/80 pt-8 text-center text-sm text-slate-400 sm:flex-row sm:text-left sm:text-base">
            <p>Made with care in Dublin by Pam, Ughroxx &amp; Sammy</p>
            <p className="text-[#002FA7]">&copy; {new Date().getFullYear()} {BRAND_NAME}. All rights reserved.</p>
          </div>
        </div>
      </footer>

      <ContactModal isOpen={contactOpen} onClose={() => setContactOpen(false)} />
    </>
  );
}