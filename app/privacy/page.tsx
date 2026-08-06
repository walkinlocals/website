"use client";

import { useState } from "react";
import Link from "next/link";
import { PAGE_MAIN, PAGE_SHELL } from "@/lib/page-layout";
import { homeTextLink } from "@/lib/homepage-ui";
import ContactModal from "@/components/contact-modal";

const bodyClass =
  "text-[0.9625rem] font-light leading-relaxed text-slate-600 sm:text-[1.0625rem] sm:leading-[1.65]";

export default function PrivacyPage() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={`${PAGE_SHELL} font-sans text-slate-950`}>
      <main className={`${PAGE_MAIN} w-full max-w-none text-slate-900`}>
        <Link href="/" className={`inline-flex items-center gap-2 ${homeTextLink}`}>
          ← Back home
        </Link>
        <h1 className="mt-8 font-serif text-4xl font-normal tracking-tight text-slate-950">
          Privacy Policy
        </h1>
        <p className={`mt-3 max-w-2xl ${bodyClass}`}>
          Last updated July 2026. This explains what personal data WalkIn Locals collects, why,
          and how you can control it.
        </p>

        <div className="mt-12 max-w-3xl space-y-10">
          <section className="space-y-4">
            <h2 className="font-serif text-2xl text-slate-950">1. What we collect</h2>
            <ul className={`list-disc space-y-2 pl-5 ${bodyClass}`}>
              <li>
                <strong className="text-slate-950">Account &amp; profile:</strong> name, email,
                phone number, date of birth, bio, profile photo, neighbourhood or origin
                location, and role (Host or Guest).
              </li>
              <li>
                <strong className="text-slate-950">Verification:</strong> identity documents you
                submit to Stripe Identity to confirm you&apos;re a real, age-verified person.
                Stripe processes and stores these directly — we only receive a pass/fail result.
              </li>
              <li>
                <strong className="text-slate-950">Payment:</strong> handled entirely by Stripe.
                We never see or store your card details.
              </li>
              <li>
                <strong className="text-slate-950">Activity:</strong> messages sent through
                in-app chat, connection requests, and the last time you were active (used to
                apply the inactivity schedule below).
              </li>
              <li>
                <strong className="text-slate-950">Usage data:</strong> basic, aggregated site
                analytics (pages visited) that don&apos;t identify you personally.
              </li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="font-serif text-2xl text-slate-950">2. Why we collect it</h2>
            <p className={bodyClass}>
              To run the core service: creating your profile, verifying you&apos;re a real adult,
              matching Hosts and Guests, processing connection payments, enabling chat between
              matched users, and keeping our directories accurate and safe.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="font-serif text-2xl text-slate-950">3. Who we share it with</h2>
            <p className={bodyClass}>
              We don&apos;t sell your data. We share only what&apos;s needed to run the service,
              with:
            </p>
            <ul className={`list-disc space-y-2 pl-5 ${bodyClass}`}>
              <li><strong className="text-slate-950">Stripe</strong> — identity verification and payments.</li>
              <li><strong className="text-slate-950">Supabase</strong> — our database and authentication provider.</li>
              <li><strong className="text-slate-950">Resend</strong> — sends transactional and contact-form emails.</li>
              <li><strong className="text-slate-950">Google Maps</strong> — shows approximate neighbourhood locations.</li>
            </ul>
            <p className={bodyClass}>
              Other users only see what you choose to put on your public profile, plus your
              phone number and email after a paid connection is confirmed.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="font-serif text-2xl text-slate-950">4. How long we keep it</h2>
            <p className={bodyClass}>
              To limit the data we hold, inactive accounts follow this schedule: a reminder at
              80 days of inactivity, removal from public directories at 90 days, and permanent
              deletion of account data at 180 days. You can also delete your account at any time
              from your profile page.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="font-serif text-2xl text-slate-950">5. Your rights</h2>
            <p className={bodyClass}>
              Under GDPR, you can ask us to access, correct, export, or delete your personal
              data at any time. Contact us using the link below and we&apos;ll action it.
            </p>
          </section>

          <p className={`mt-4 ${bodyClass}`}>
            Questions about your data?{" "}
            <button
              type="button"
              onClick={() => setIsOpen(true)}
              className="text-[#002FA7] font-medium hover:underline focus:outline-none"
            >
              Contact us
            </button>{" "}
            and we&apos;ll be glad to help.
          </p>
        </div>
      </main>

      <ContactModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </div>
  );
}
