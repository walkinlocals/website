"use client";

import { useState } from "react";
import { Loader2, X, Heart } from "lucide-react";
import { KLEIN_BLUE } from "@/lib/brand";

const modalTitle = "font-sans text-lg font-semibold uppercase tracking-wide text-[#002FA7] sm:text-xl";

type SubmitState =
  | { status: "idle" }
  | { status: "submitting" }
  | { status: "success" }
  | { status: "error"; message: string };

type ContactModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export default function ContactModal({ isOpen, onClose }: ContactModalProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [submit, setSubmit] = useState<SubmitState>({ status: "idle" });

  function closeModal() {
    onClose();
    setTimeout(() => {
      setSubmit({ status: "idle" });
      setName("");
      setEmail("");
      setMessage("");
    }, 200);
  }

  if (!isOpen) return null;

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
    <div role="dialog" aria-modal="true" aria-labelledby="feedback-title" className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close contact form"
        onClick={closeModal}
        className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm"
      />
      <div className="relative z-10 w-full max-w-md overflow-hidden rounded-3xl bg-white p-8 shadow-xl ring-1 ring-slate-100">
        <div className="pointer-events-none absolute right-0 top-0 h-32 w-32 rounded-full bg-[#002FA7]/5 blur-2xl" />

        <button
          type="button"
          onClick={closeModal}
          aria-label="Close"
          className="absolute right-5 top-5 rounded-full p-1.5 text-slate-400 transition hover:bg-slate-50 hover:text-slate-950"
        >
          <X className="h-4 w-4" />
        </button>

        {submit.status === "success" ? (
          <div className="relative space-y-4 py-6 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#002FA7]/10">
              <Heart className="h-6 w-6" style={{ fill: KLEIN_BLUE, stroke: KLEIN_BLUE }} />
            </div>
            <p className="font-serif text-xl text-slate-950">Thank you — we&apos;ll be in touch soon.</p>
            <button
              type="button"
              onClick={closeModal}
              className="rounded-full bg-[#002FA7] px-6 py-3 text-sm font-medium text-white transition hover:bg-[#001e6c]"
            >
              Close
            </button>
          </div>
        ) : (
          <div className="relative">
            <h2 id="feedback-title" className={modalTitle}>Contact us</h2>
            <p className="mt-1 text-sm font-light text-slate-500">Questions, ideas, or a Dublin story to share.</p>
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm shadow-sm transition focus:border-[#002FA7] focus:outline-none focus:ring-1 focus:ring-[#002FA7]"
              />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm shadow-sm transition focus:border-[#002FA7] focus:outline-none focus:ring-1 focus:ring-[#002FA7]"
              />
              <textarea
                required
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="How can we help?"
                className="w-full resize-none rounded-2xl border border-slate-200 px-4 py-3 text-sm shadow-sm transition focus:border-[#002FA7] focus:outline-none focus:ring-1 focus:ring-[#002FA7]"
              />
              {submit.status === "error" ? (
                <p className="text-sm text-red-600" role="alert">{submit.message}</p>
              ) : null}
              <button
                type="submit"
                disabled={submit.status === "submitting"}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-[#002FA7] py-4 text-sm font-medium text-white shadow-md shadow-[#002FA7]/20 transition hover:bg-[#001e6c] disabled:opacity-50"
              >
                {submit.status === "submitting" ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Send message
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
