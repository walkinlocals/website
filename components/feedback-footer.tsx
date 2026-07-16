"use client";

import { useState } from "react";
import { Loader2, X, Heart } from "lucide-react";

type SubmitState =
  | { status: "idle" }
  | { status: "submitting" }
  | { status: "success" }
  | { status: "error"; message: string };

export default function FeedbackFooter() {
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
    <>
      {/* Forced pure white background via inline styles to override any layout cream colors */}
      <section
        className="relative border-t border-slate-100 overflow-hidden"
        style={{ backgroundColor: "#ffffff" }}
      >
        {/* Subtle decorative dot mesh background */}
        <div className="pointer-events-none absolute inset-0 z-0 opacity-20 bg-[radial-gradient(#002fa709_1.5px,transparent_1.5px)] [background-size:24px_24px]" />

        <div className="relative z-10 mx-auto max-w-6xl px-6 py-14">
          <div className="flex flex-col items-start justify-between gap-8 sm:flex-row sm:items-center">
            <div>
              <span className="flex items-center gap-1.5 text-lg font-semibold tracking-tight text-slate-950">
                WalkIn
                <span className="text-[#002FA7]" style={{ color: "#002FA7" }}>Locals</span>
                {/* Inline styled Heart to bypass any global red SVG/Heart rules */}
                <Heart
                  className="h-4 w-4 animate-pulse"
                  style={{ fill: "#002FA7", stroke: "#002FA7" }}
                />
              </span>
              <p className="mt-2 max-w-md text-slate-500 text-sm font-light leading-relaxed">
                Questions, ideas, or want to tell us about a home? We&apos;d love to hear from you.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsOpen(true)}
              className="rounded-full px-6 py-3.5 text-xs font-mono font-semibold uppercase tracking-widest text-white transition-all duration-300 hover:bg-[#001e6c] hover:scale-[1.01] shadow-[0_4px_15px_rgba(0,47,167,0.18)]"
              style={{ backgroundColor: "#002FA7" }}
            >
              Contact us
            </button>
          </div>
        </div>
      </section>

      {/* Feedback modal */}
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
            aria-label="Close feedback form"
            onClick={closeModal}
            className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm transition-opacity"
          />

          {/* Panel */}
          <div
            className="relative w-full max-w-md rounded-3xl p-8 shadow-[0_20px_50px_rgba(0,47,167,0.1)] ring-1 ring-slate-100 z-10 overflow-hidden"
            style={{ backgroundColor: "#ffffff" }}
          >
            {/* Soft blue radiant aura at the top corner of the modal */}
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
                    Thank you
                  </h2>
                  <p className="mt-2 text-slate-500 text-sm font-light leading-relaxed">
                    Your message is on its way to us. We&apos;ll be in touch soon.
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
                    Get in touch
                  </span>
                </div>
                <h2 id="feedback-title" className="font-serif text-2xl font-normal text-slate-950">
                  Share your thoughts
                </h2>
                <p className="mt-1 text-sm text-slate-500 font-light">
                  Tell us what&apos;s on your mind.
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
                      Message
                    </label>
                    <textarea
                      id="fb-message"
                      required
                      rows={4}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="mt-1.5 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-950 focus:border-[#002FA7] focus:outline-none focus:ring-1 focus:ring-[#002FA7] transition-all duration-300 font-light placeholder:text-slate-400 resize-none"
                      style={{ backgroundColor: "#ffffff" }}
                      placeholder="How can we help?"
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
                    {submit.status === "submitting" ? "Sending…" : "Send message"}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}