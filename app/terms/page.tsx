"use client";

import { useState } from "react";
import { Loader2, X, Heart } from "lucide-react";

type SubmitState =
  | { status: "idle" }
  | { status: "submitting" }
  | { status: "success" }
  | { status: "error"; message: string };

export default function TermsPage() {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [submit, setSubmit] = useState<SubmitState>({ status: "idle" });

  function closeModal() {
    setIsOpen(false);
    setTimeout(() => {
      setSubmit({ status: "idle" });
      setName("");
      setEmail("");
      setMessage("");
    }, 200);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmit({ status: "submitting" });

    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim() || undefined,
          email: email.trim() || undefined,
          message: message.trim(),
        }),
      });

      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        setSubmit({ status: "error", message: body.error ?? `Failed (${res.status})` });
        return;
      }

      setSubmit({ status: "success" });
    } catch (err) {
      setSubmit({
        status: "error",
        message: err instanceof Error ? err.message : "Network error",
      });
    }
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-16 text-slate-900 sm:py-24">
      <span className="inline-flex items-center gap-1 font-mono text-[9px] uppercase tracking-[0.3em] text-[#002FA7] font-semibold bg-[#002fa7]/5 px-3 py-1 rounded-full">
        ✦ MAXIMUM PARTNERSHIP PROTECTION DEED ✦
      </span>
      <h1 className="mt-4 font-serif text-4xl font-normal tracking-tight text-slate-950">
        Terms of Service &amp; Absolute Liability Release
      </h1>
      <p className="mt-3 text-sm text-slate-500 font-light leading-relaxed">
        Last updated July 2026. This is a legally binding contract between you and the individual developer partnership operating WalkIn Locals (&quot;we,&quot; &quot;us,&quot; &quot;our,&quot; or the &quot;Partnership&quot;). By creating an account, you explicitly assent to these terms.
      </p>

      {/* SECTION 1: NATURE OF THE PLATFORM */}
      <section className="mt-12 space-y-4">
        <h2 className="font-serif text-2xl text-slate-950">1. Scope of Utility &amp; Legal Capacity</h2>
        <p className="text-sm font-light leading-relaxed text-slate-600">
          WalkIn Locals is an independent, experimental peer-to-peer software project owned and operated by an un-incorporated developer partnership. The software functions strictly as a passive online directory and marketplace utility to facilitate initial introductions between independent travelers (&quot;Guests&quot;) and local residents (&quot;Hosts&quot;).
        </p>
        <div className="bg-red-50 border-l-4 border-red-600 p-4 text-xs text-red-950 font-light leading-relaxed rounded-r-md">
          <strong>CRITICAL ASSUMPTION OF RISK DISCLOSURE:</strong> You explicitly recognize that the platform operators do not own, inspect, vet, manage, or control any physical host properties, neighborhoods, or individuals. We provide software connections, not offline real-world hospitality services. By arranging an in-home visit, you acknowledge that you are permitting a stranger into your private residence, or entering the private residence of a stranger, entirely at your own discretion and exclusive personal risk.
        </div>
      </section>

      {/* SECTION 2: REGISTRATION & STRIPE IDENTITY DISCLAIMER */}
      <section className="mt-10 space-y-4">
        <h2 className="font-serif text-2xl text-slate-950">2. Verification Limitations &amp; Account Controls</h2>
        <p className="text-sm font-light leading-relaxed text-slate-600">
          You must be at least <strong>18 years old</strong> to register. Identity verification checks are performed via an integrated third-party api protocol (Stripe Identity).
        </p>
        <p className="text-sm font-light leading-relaxed text-slate-600">
          The Partnership makes no structural warranties or representations that our verification procedures are infallible, or that a verified user is safe, law-abiding, or mentally sound. The verification layer is an identity check only, not a comprehensive criminal background screening. We retain an un-reviewable right to terminate any profile at any time, for any reason, with zero ongoing civil liability.
        </p>
      </section>

      {/* SECTION 3: TRANSACTIONAL RULES */}
      <section className="mt-10 space-y-4">
        <h2 className="font-serif text-2xl text-slate-950">3. Fee Structures, Disintermediation, &amp; No Escrow</h2>
        <p className="text-sm font-light leading-relaxed text-slate-600">
          Platform marketplace pricing is structural: Guests pay <strong>€35.00 per person</strong>, Hosts receive a fixed payout of <strong>€25.00 per person</strong>, and the Partnership retains a <strong>€10.00 per person</strong> technology facilitation fee. Maximum party sizes are hardcapped at <strong>6 individuals</strong>.
        </p>
        <ul className="list-disc space-y-2 pl-5 text-sm font-light leading-relaxed text-slate-600">
          <li>
            <strong>Immediate Direct Payout Routing:</strong> Financial transfers use Stripe Destination Charges. The Partnership does not collect, hold, or maintain legal custody of user funds, nor do we provide financial escrow service protections. Payouts route instantly to the Host&apos;s connected Stripe Express account upon successful checkout.
          </li>
          <li>
            <strong>Chargeback &amp; Dispute Indemnity:</strong> If a Guest triggers an operational credit card chargeback through their financial institution, any resulting gateway processing penalties, bank administrative fees, or currency clawbacks are the exclusive financial liability of the Host&apos;s connected Stripe balance.
          </li>
          <li>
            <strong>Disintermediation:</strong> Arranging subsequent or repeat offline visits outside of the software application layer constitutes a material breach of this contract and completely voids any in-app messaging or identity safety mechanisms.
          </li>
        </ul>
      </section>

      {/* SECTION 4: INACTIVITY SEQUENCE */}
      <section className="mt-10 space-y-4">
        <h2 className="font-serif text-2xl text-slate-950">4. Automated Account Lifecycle</h2>
        <p className="text-sm font-light leading-relaxed text-slate-600">
          To minimize data liability and ensure systemic privacy compliance under regional regulations, accounts undergo an automated dormancy routine: system warning at 80 days of continuous inactivity, profile hiding from public view directories at 90 days, and full, permanent account erasure from backend databases at 180 days.
        </p>
      </section>

      {/* SECTION 5: MAXIMUM POSSIBLE LIABILITY PROTECTION */}
      <section className="mt-10 space-y-4">
        <h2 className="font-serif text-2xl text-slate-950 font-bold text-red-600">5. TOTAL WAIVER OF LIABILITY &amp; FINANCIAL CEILING</h2>
        <p className="text-xs uppercase tracking-wider text-slate-950 font-bold leading-relaxed">
          THIS SECTION WAIVES CRITICAL CIVIL RIGHTS TO FILE LAWSUITS. READ IT CAREFULLY.
        </p>
        <ul className="list-disc space-y-2 pl-5 text-sm font-light leading-relaxed text-slate-600">
          <li>
            <strong>Joint and Personal Waiver:</strong> To the absolute maximum extent permitted by applicable laws of Ireland and the European Union, you explicitly release, waive, and forever discharge the Partnership, as well as each individual partner, developer, co-founder, and infrastructure agent personally, from any and all current or future legal or financial claims, torts, lawsuits, or demands related to property destruction, physical theft, burglary, bodily injury, assault, severe emotional distress, personal illness, accidents, or death arising out of or connecting to any offline matches or home visits arranged via this software.
          </li>
          <li>
            <strong>&quot;As-Is&quot; Software Warranty Exclusion:</strong> The entire software system architecture is delivered strictly &quot;as-is&quot;. The developers offer no warranties or indemnities regarding data breach immunity, malicious hacks, API downtime, or server-side structural database vulnerabilities.
          </li>
          <li>
            <strong>Absolute Financial Liability Ceiling:</strong> You explicitly agree that the combined, aggregate financial liability of the Partnership and all its individual partners for any civil claim whatsoever shall be capped at exactly **€0.00** (or the exact amount of platform service fees collected from your specific individual account in the 30 days preceding the event giving rise to the claim).
          </li>
        </ul>
      </section>

      {/* SECTION 6: USER AGREEMENT TO PAY FOR LAWSUITS */}
      <section className="mt-10 space-y-4">
        <h2 className="font-serif text-2xl text-slate-950">6. Hold Harmless &amp; Active Indemnification</h2>
        <p className="text-sm font-light leading-relaxed text-slate-600">
          You agree to completely indemnify, defend, and hold harmless the Partnership and each of its individual developers from and against any third-party claims, lawsuits, damages, losses, liabilities, and expenses (including all legal fees, solicitor costs, and court disbursements) arising out of or relating to your misconduct, your breach of these Terms, or your negligent behavior during an offline match or home visit.
        </p>
      </section>

      {/* SECTION 7: SEVERABILITY & CONTRACTUAL CONTINUANCE */}
      <section className="mt-10 space-y-4">
        <h2 className="font-serif text-2xl text-slate-950">7. Third-Party Rights &amp; Severability</h2>
        <p className="text-sm font-light leading-relaxed text-slate-600">
          <strong>Severability:</strong> If any provision, sentence, or specific clause of these Terms is found by an Irish court or regulatory authority to be invalid, illegal, or completely unenforceable, that specific provision shall be severed from the contract. The remainder of these Terms shall continue in full force and effect as if the severed provision had never been included.
        </p>
        <p className="text-sm font-light leading-relaxed text-slate-600">
          <strong>Third-Party Exclusion:</strong> These terms do not confer any third-party rights. No person who is not an active registered member of this platform has any legal right to enforce or sue under any provision of this agreement.
        </p>
      </section>

      {/* SECTION 8: JURISDICTION */}
      <section className="mt-10 space-y-4">
        <h2 className="font-serif text-2xl text-slate-950">8. Governing Law &amp; Forum Selection</h2>
        <p className="text-sm font-light leading-relaxed text-slate-600">
          These Terms, and any non-contractual obligations or disputes arising out of them, are governed exclusively by the laws of <strong>Ireland</strong>. You and the Partnership explicitly agree that the courts located in <strong>Dublin, Ireland</strong> hold exclusive jurisdiction to settle any legal claim or lawsuit arising under this agreement.
        </p>
      </section>

      <p className="mt-12 text-sm text-slate-500 font-light">
        Questions regarding legal compliance?{" "}
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="text-[#002FA7] font-medium hover:underline focus:outline-none"
        >
          Contact our developer partnership
        </button>{" "}
        directly.
      </p>

      {/* Interlinked Contact Modal Terminal */}
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="feedback-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          {/* Backdrop */}
          <button
            type="button"
            aria-label="Close partnership contact form"
            onClick={closeModal}
            className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm transition-opacity"
          />

          {/* Panel */}
          <div
            className="relative w-full max-w-md rounded-3xl p-8 shadow-[0_20px_50px_rgba(0,47,167,0.1)] ring-1 ring-slate-100 z-10 overflow-hidden"
            style={{ backgroundColor: "#ffffff" }}
          >
            {/* Soft blue radiant aura at top corner */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#002fa7]/5 rounded-full filter blur-xl pointer-events-none" />

            <button
              type="button"
              onClick={closeModal}
              aria-label="Close"
              className="absolute right-5 top-5 rounded-full p-1.5 text-slate-400 transition-colors hover:bg-slate-50 hover:text-slate-950"
            >
              <X className="h-4 w-4" />
            </button>

            {submit.status === "success" ? (
              <div className="py-6 text-center space-y-4">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#002fa7]/5">
                  <Heart
                    className="h-6 w-6"
                    style={{ fill: "#002FA7", stroke: "#002FA7" }}
                  />
                </div>
                <div>
                  <h2 id="feedback-title" className="font-serif text-xl font-normal text-slate-950">
                    Message Sent
                  </h2>
                  <p className="mt-2 text-slate-500 text-sm font-light leading-relaxed">
                    Your transmission has been routed to the developer partnership compliance inbox.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-full px-6 py-3 text-xs font-mono font-semibold uppercase tracking-widest text-white transition-all duration-300 hover:bg-[#001e6c]"
                  style={{ backgroundColor: "#002FA7" }}
                >
                  Close
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2 mb-1">
                  <Heart
                    className="h-5 w-5"
                    style={{ fill: "#002FA7", stroke: "#002FA7" }}
                  />
                  <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-[#002FA7] font-semibold" style={{ color: "#002FA7" }}>
                    Partnership Terminal
                  </span>
                </div>
                <h2 id="feedback-title" className="font-serif text-2xl font-normal text-slate-950">
                  Secure Communications
                </h2>
                <p className="mt-1 text-sm text-slate-500 font-light">
                  Submit operations issues, data updates, or legal queries directly.
                </p>

                <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                  <div>
                    <label htmlFor="fb-name" className="block text-xs font-mono tracking-wider uppercase text-slate-600">
                      Name
                    </label>
                    <input
                      id="fb-name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="mt-1.5 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-950 focus:border-[#002FA7] focus:outline-none focus:ring-1 focus:ring-[#002FA7] transition-all duration-300 font-light placeholder:text-slate-400"
                      style={{ backgroundColor: "#ffffff" }}
                      placeholder="Your name"
                    />
                  </div>

                  <div>
                    <label htmlFor="fb-email" className="block text-xs font-mono tracking-wider uppercase text-slate-600">
                      Email
                    </label>
                    <input
                      id="fb-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="mt-1.5 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-950 focus:border-[#002FA7] focus:outline-none focus:ring-1 focus:ring-[#002FA7] transition-all duration-300 font-light placeholder:text-slate-400"
                      style={{ backgroundColor: "#ffffff" }}
                      placeholder="you@example.com"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="fb-message"
                      className="block text-xs font-mono tracking-wider uppercase text-slate-600"
                    >
                      Message Context
                    </label>
                    <textarea
                      id="fb-message"
                      required
                      rows={4}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="mt-1.5 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-950 focus:border-[#002FA7] focus:outline-none focus:ring-1 focus:ring-[#002FA7] transition-all duration-300 font-light placeholder:text-slate-400 resize-none"
                      style={{ backgroundColor: "#ffffff" }}
                      placeholder="State the nature of your inquiry here..."
                    />
                  </div>

                  {submit.status === "error" && (
                    <p className="text-sm text-red-600 font-light" role="alert">
                      {submit.message}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={submit.status === "submitting"}
                    className="flex w-full items-center justify-center gap-2 rounded-full px-6 py-4 text-xs font-mono font-semibold uppercase tracking-widest text-white transition-all duration-300 hover:bg-[#001e6c] disabled:cursor-not-allowed disabled:opacity-50 shadow-[0_4px_15px_rgba(0,47,167,0.18)]"
                    style={{ backgroundColor: "#002FA7" }}
                  >
                    {submit.status === "submitting" && (
                      <Loader2 className="h-4 w-4 animate-spin text-white" />
                    )}
                    {submit.status === "submitting" ? "Transmitting…" : "Send message"}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </main>
  );
}