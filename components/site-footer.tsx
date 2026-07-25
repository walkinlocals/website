"use client";

import Link from "next/link";
import { useState } from "react";
import ContactModal from "@/components/contact-modal";

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
            className={`h-7 w-11 shrink-0 aspect-[3/2] object-contain object-center ${
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
      <h3 className="text-sm font-semibold text-[#002FA7]">{title}</h3>
      <ul className="mt-4 space-y-2.5 text-sm text-slate-600">{children}</ul>
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
        <div className="mx-auto max-w-6xl px-6 pt-12 pb-12 sm:px-8">
          <div className="flex flex-col gap-6 border-b border-slate-200/80 pb-8 sm:flex-row sm:items-center sm:justify-between">
            <Link href="/" className="flex shrink-0 items-center gap-2.5">
              <span className="text-base font-semibold tracking-tight text-slate-950 sm:text-lg">
                WalkIn<span className="text-[#002FA7]">Locals</span>
              </span>
              <img src="/images/logo.png" alt="WalkIn Locals" className="h-8 w-8 object-contain sm:h-9 sm:w-9" />
            </Link>
            <button
              type="button"
              onClick={() => setContactOpen(true)}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:border-[#002FA7]/30 hover:text-[#002FA7]"
            >
              Contact us
            </button>
          </div>

          <div className="mt-10 grid grid-cols-2 gap-10 md:grid-cols-3 lg:grid-cols-6">
            <FooterColumn title="About WalkIn Locals">
              <FooterLink href="/about-us">Our story</FooterLink>
              <FooterLink href="/how-it-works">How it works</FooterLink>
              <FooterLink href="/terms">Terms &amp; conditions</FooterLink>
            </FooterColumn>

            <FooterColumn title="Guests">
              <FooterLink href="/how-it-works">How visits work</FooterLink>
              <FooterLink href="/pay">Connection pricing</FooterLink>
              <FooterLink href="/login?mode=signup&role=Guest">Sign up as a guest</FooterLink>
              <FooterLink href="/terms">Guest policies</FooterLink>
            </FooterColumn>

            <FooterColumn title="Hosts">
              <FooterLink href="/get-paid">Host payouts</FooterLink>
              <FooterLink href="/how-it-works">Hosting process</FooterLink>
              <FooterLink href="/login?mode=signup&role=Host">Become a host</FooterLink>
              <FooterLink href="/terms">Host policies</FooterLink>
            </FooterColumn>

            <FooterColumn title="Follow us">
              <li>
                <a
                  href="https://www.instagram.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition hover:text-[#002FA7] hover:underline"
                >
                  Instagram
                </a>
              </li>
              <li>
                <a
                  href="https://www.tiktok.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition hover:text-[#002FA7] hover:underline"
                >
                  TikTok
                </a>
              </li>
              <li>
                <a
                  href="https://www.trustpilot.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition hover:text-[#002FA7] hover:underline"
                >
                  Trustpilot
                </a>
              </li>
            </FooterColumn>

            <div className="col-span-2 lg:col-span-2">
              <h3 className="text-sm font-semibold text-[#002FA7]">We accept</h3>

              <div className="mt-4">
                <PaymentAcceptRow />
              </div>

              <p className="mt-3 text-[11px] font-light text-slate-500">
                Secure payments via Stripe. Availability may vary by region.
              </p>
            </div>
          </div>

          <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-slate-200/80 pt-8 text-center text-xs text-slate-400 sm:flex-row sm:text-left">
            <p>Made with care in Dublin by Pam, Ughroxx &amp; Sammy</p>
            <p>&copy; {new Date().getFullYear()} Walkinlocals. All rights reserved.</p>
          </div>
        </div>
      </footer>

      <ContactModal isOpen={contactOpen} onClose={() => setContactOpen(false)} />
    </>
  );
}