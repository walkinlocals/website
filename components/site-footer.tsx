"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import ContactModal from "@/components/contact-modal";
import { OpenWaitlistButton } from "@/components/open-waitlist-button";
import { SITE_GUTTER } from "@/lib/page-layout";
import { brandWordmark, BRAND_NAME, siteTitleSm } from "@/lib/homepage-ui";

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
          <div className="flex flex-col gap-4 border-b border-slate-200/80 pb-10 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
            <Link href="/" className="flex min-w-0 max-w-full items-center gap-2 sm:gap-3">
              <span className={brandWordmark}>{BRAND_NAME}</span>
              <Image
                src="/images/logo.png"
                alt={BRAND_NAME}
                width={44}
                height={44}
                className="h-9 w-9 shrink-0 object-contain sm:h-11 sm:w-11"
              />
            </Link>
            <button
              type="button"
              onClick={() => setContactOpen(true)}
              className="w-full rounded-lg border border-slate-200 bg-white px-5 py-2.5 text-base font-medium text-slate-700 shadow-sm hover:border-[#002FA7]/30 hover:text-[#002FA7] sm:w-auto sm:text-lg"
            >
              Contact us
            </button>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-8 sm:grid-cols-2 sm:gap-10 md:grid-cols-4">
            <FooterColumn title="Guests">
              <li>
                <OpenWaitlistButton role="Guest" className="transition hover:text-[#002FA7] hover:underline">
                  Join guest waitlist
                </OpenWaitlistButton>
              </li>
            </FooterColumn>

            <FooterColumn title="Hosts">
              <li>
                <OpenWaitlistButton role="Host" className="transition hover:text-[#002FA7] hover:underline">
                  Join host waitlist
                </OpenWaitlistButton>
              </li>
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

            <FooterColumn title="Legal">
              <FooterLink href="/privacy">Privacy</FooterLink>
            </FooterColumn>
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
