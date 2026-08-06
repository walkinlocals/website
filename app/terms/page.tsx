"use client";

import { useState } from "react";
import { PAGE_MAIN, PAGE_SHELL } from "@/lib/page-layout";
import ContactModal from "@/components/contact-modal";

/** Body copy ~10% above default `text-sm` / `text-xs` (titles unchanged). */
const termsBody =
  "text-[0.9625rem] font-light leading-relaxed sm:text-[1.0625rem] sm:leading-[1.65]";
const termsBodySm =
  "text-[0.825rem] font-light leading-relaxed sm:text-[0.9rem] sm:leading-[1.65]";

export default function TermsPage() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={`${PAGE_SHELL} font-sans text-slate-950`}>
      <main className={`${PAGE_MAIN} w-full max-w-none text-slate-900`}>
        <h1 className="font-serif text-4xl font-normal tracking-tight text-slate-950">
          Terms of Service
        </h1>
        <p className={`mt-3 text-slate-500 ${termsBody}`}>
          Last updated July 2026. These Terms form a binding agreement between you and the
          unincorporated partnership operating WalkIn Locals (&quot;we,&quot; &quot;us,&quot; or
          &quot;the Partnership&quot;). By creating an account, you agree to be bound by them.
        </p>

        <div className="mt-12">
            <section id="scope" className="scroll-mt-28 space-y-4">
              <h2 className="font-serif text-2xl text-slate-950">1. Nature of the Service</h2>
              <p className={`${termsBody} text-slate-600`}>
                WalkIn Locals is an online platform operated by an unincorporated partnership
                that connects travellers (&quot;Guests&quot;) with local residents in Dublin
                (&quot;Hosts&quot;) for in-person visits at a Host&apos;s home. We provide the
                software and payment tools that facilitate these introductions. We are not a
                party to, and do not supervise, any visit arranged between a Guest and a Host.
              </p>
              <div className={`rounded-xl border border-slate-200 bg-slate-50 p-4 text-slate-700 ${termsBodySm}`}>
                <strong className="text-slate-950">Important:</strong> We do not own, inspect,
                vet, or supervise any Host property, or conduct ongoing monitoring of Guests or
                Hosts. Arranging or attending an in-person visit is done at your own discretion
                and risk, in the same way it would be with any person you choose to meet through
                a third-party platform.
              </div>
            </section>

            <section id="verification" className="mt-10 scroll-mt-28 space-y-4">
              <h2 className="font-serif text-2xl text-slate-950">2. Eligibility &amp; Verification</h2>
              <p className={`${termsBody} text-slate-600`}>
                You must be at least 18 years old to register an account. We use Stripe Identity
                to verify certain identity details for registered users.
              </p>
              <p className={`${termsBody} text-slate-600`}>
                Identity verification confirms the documents submitted; it is not a criminal
                background check and does not guarantee the conduct, safety, or suitability of
                any user. We reserve the right to suspend or terminate an account, at our
                discretion, for a breach of these Terms or conduct we reasonably believe poses a
                risk to other users.
              </p>
            </section>

            <section id="fees" className="mt-10 scroll-mt-28 space-y-4">
              <h2 className="font-serif text-2xl text-slate-950">3. Fees &amp; Payments</h2>
              <p className={`${termsBody} text-slate-600`}>
                Guests pay a connection fee of <strong>€35 per person</strong>. Hosts receive{" "}
                <strong>€25 per person</strong> from that fee, and the Partnership retains{" "}
                <strong>€10 per person</strong> as a service fee. A single connection request is
                limited to a maximum of <strong>6 people</strong>.
              </p>
              <ul className={`list-disc space-y-2 pl-5 text-slate-600 ${termsBody}`}>
                <li>
                  <strong>Payment processing.</strong> Payments are processed by Stripe, which
                  pays Hosts directly to their connected Stripe Express account. We do not hold
                  or take custody of Guest or Host funds, and we do not provide escrow services.
                </li>
                <li>
                  <strong>Chargebacks.</strong> If a Guest&apos;s payment is disputed or reversed
                  by their card issuer, any resulting fees, penalties, or clawbacks may be
                  deducted from the relevant Host&apos;s Stripe balance.
                </li>
                <li>
                  <strong>Repeat visits.</strong> Arranging further visits directly with a Host or
                  Guest, outside the platform, after your first connection was made through it, is
                  a breach of these Terms. Doing so falls outside the safety and support
                  protections we provide.
                </li>
              </ul>
            </section>

            <section id="refunds" className="mt-10 scroll-mt-28 space-y-4">
              <h2 className="font-serif text-2xl text-slate-950">4. Cancellations &amp; Refunds</h2>
              <p className={`${termsBody} text-slate-600`}>
                Guests are only charged the connection fee after a Host has accepted their visit
                request. Because the fee unlocks contact details and in-app chat immediately on
                payment, <strong>connection fees are non-refundable</strong> once paid, except as
                described below or where required by applicable law.
              </p>
              <ul className={`list-disc space-y-2 pl-5 text-slate-600 ${termsBody}`}>
                <li>
                  <strong>Host cancels after payment.</strong> If a Host cancels or does not
                  honour a paid, accepted visit, the Guest is entitled to a full refund of the
                  connection fee. Contact us and we will process it.
                </li>
                <li>
                  <strong>Guest cancels.</strong> If a Guest cancels after paying, the connection
                  fee is not refunded, as it has already unlocked the Host&apos;s contact details.
                </li>
                <li>
                  <strong>How to request a refund.</strong> Refund requests are currently reviewed
                  individually — contact us using the link at the bottom of this page and include
                  your account email and the date of the affected visit.
                </li>
              </ul>
            </section>

            <section id="inactivity" className="mt-10 scroll-mt-28 space-y-4">
              <h2 className="font-serif text-2xl text-slate-950">5. Account Inactivity</h2>
              <p className={`${termsBody} text-slate-600`}>
                To keep our directories accurate and to limit the personal data we retain,
                inactive accounts follow this schedule: a reminder notice at 80 days of
                inactivity, removal from public directories at 90 days, and permanent deletion of
                account data at 180 days.
              </p>
            </section>

            <section id="liability" className="mt-10 scroll-mt-28 space-y-4">
              <h2 className="font-serif text-2xl text-slate-950">6. Limitation of Liability</h2>
              <p className={`${termsBody} text-slate-600`}>
                To the maximum extent permitted by the laws of Ireland and the European Union,
                the Partnership and its individual partners are not liable for any indirect,
                incidental, or consequential loss, or for any injury, loss, or damage arising from
                an in-person visit arranged through the platform, including property damage,
                theft, personal injury, or emotional distress.
              </p>
              <p className={`${termsBody} text-slate-600`}>
                Our total liability to you for any claim arising out of or relating to these
                Terms or your use of the platform is limited to the total service fees we
                received from your account in the 30 days preceding the event giving rise to the
                claim. The platform is provided &quot;as is&quot;, without warranties of
                availability, security, or fitness for a particular purpose.
              </p>
            </section>

            <section id="indemnity" className="mt-10 scroll-mt-28 space-y-4">
              <h2 className="font-serif text-2xl text-slate-950">7. Indemnification</h2>
              <p className={`${termsBody} text-slate-600`}>
                You agree to indemnify and hold harmless the Partnership and its individual
                partners from any third-party claims, damages, losses, or expenses (including
                reasonable legal fees) arising from your breach of these Terms, your misuse of the
                platform, or your conduct during an in-person visit.
              </p>
            </section>

            <section id="severability" className="mt-10 scroll-mt-28 space-y-4">
              <h2 className="font-serif text-2xl text-slate-950">8. Severability &amp; Third Parties</h2>
              <p className={`${termsBody} text-slate-600`}>
                <strong>Severability.</strong> If a court or regulator finds any provision of
                these Terms invalid or unenforceable, that provision will be severed and the
                remaining Terms will continue in full effect.
              </p>
              <p className={`${termsBody} text-slate-600`}>
                <strong>Third parties.</strong> These Terms do not confer any rights on anyone who
                is not a registered user of the platform.
              </p>
            </section>

            <section id="jurisdiction" className="mt-10 scroll-mt-28 space-y-4">
              <h2 className="font-serif text-2xl text-slate-950">9. Governing Law</h2>
              <p className={`${termsBody} text-slate-600`}>
                These Terms, and any dispute arising from them, are governed by the laws of{" "}
                <strong>Ireland</strong>. The courts of <strong>Dublin, Ireland</strong> have
                exclusive jurisdiction over any claim arising under this agreement.
              </p>
            </section>

            <p className={`mt-12 text-slate-500 ${termsBody}`}>
              Questions about these Terms?{" "}
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
