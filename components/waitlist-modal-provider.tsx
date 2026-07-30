"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { Loader2, X } from "lucide-react";

const modalTitle = "font-sans text-lg font-semibold uppercase tracking-wide text-[#002FA7] sm:text-xl";

type WaitlistRole = "Host" | "Guest";

type WaitlistModalContextValue = {
  openWaitlistModal: (role: WaitlistRole) => void;
};

const WaitlistModalContext = createContext<WaitlistModalContextValue | null>(null);

export function useWaitlistModal() {
  const ctx = useContext(WaitlistModalContext);
  if (!ctx) {
    throw new Error("useWaitlistModal must be used within WaitlistModalProvider");
  }
  return ctx;
}

export function WaitlistModalProvider({ children }: { children: ReactNode }) {
  const [showModal, setShowModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState<WaitlistRole | null>(null);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [whatsappLink, setWhatsappLink] = useState<string | null>(null);

  const openWaitlistModal = useCallback((role: WaitlistRole) => {
    setSelectedRole(role);
    setShowModal(true);
    setPhone("");
    setPhoneError(null);
    setMessage(null);
    setWhatsappLink(null);
  }, []);

  useEffect(() => {
    const onOpen = (event: Event) => {
      const role = (event as CustomEvent<WaitlistRole>).detail;
      if (role === "Host" || role === "Guest") {
        openWaitlistModal(role);
      }
    };
    window.addEventListener("walkinlocals:open-waitlist", onOpen);
    return () => window.removeEventListener("walkinlocals:open-waitlist", onOpen);
  }, [openWaitlistModal]);

  const handlePhoneChange = (value: string) => {
    setPhone(value);
    const internationalPhoneRegex = /^\+[1-9]\d{1,3}\d{6,14}$/;
    const cleanValue = value.replace(/[\s\-()]/g, "");

    if (!cleanValue.startsWith("+")) {
      setPhoneError("Number must start with a '+' country prefix (e.g., +353)");
    } else if (!internationalPhoneRegex.test(cleanValue)) {
      setPhoneError("Please enter a valid international number format (e.g., +353871234567)");
    } else {
      setPhoneError(null);
    }
  };

  const handleWaitlistSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phoneError || !phone) return;

    setSubmitting(true);
    setMessage(null);
    setWhatsappLink(null);

    const cleanPhoneNumber = phone.replace(/[\s\-()]/g, "");

    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName,
          email,
          phone: cleanPhoneNumber,
          roleIntent: selectedRole,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage({ type: "error", text: data.error || "Failed to join waitlist." });
      } else {
        setMessage({
          type: "success",
          text: "You're on the list! We'll send you a welcome message on WhatsApp within 24 hours.",
        });

        const businessNumber = process.env.NEXT_PUBLIC_BUSINESS_WHATSAPP;
        if (businessNumber && selectedRole) {
          const whatsappText = `Hi WALKINLOCALS! I just joined the Dublin ${selectedRole} waitlist. My name is ${fullName}. Can't wait for the neighborhood doors to unlock!`;
          setWhatsappLink(
            `https://wa.me/${businessNumber}?text=${encodeURIComponent(whatsappText)}`,
          );
        }

        setFullName("");
        setEmail("");
        setPhone("");
      }
    } catch {
      setMessage({ type: "error", text: "Network error. Please try again later." });
    } finally {
      setSubmitting(false);
    }
  };

  const value = useMemo(() => ({ openWaitlistModal }), [openWaitlistModal]);

  return (
    <WaitlistModalContext.Provider value={value}>
      {children}

      {showModal ? (
        <div role="dialog" aria-modal="true" aria-labelledby="waitlist-title" className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="Close"
            onClick={() => setShowModal(false)}
            className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm"
          />
          <div className="relative z-10 max-h-[90vh] w-full max-w-md overflow-y-auto rounded-3xl bg-white p-8 shadow-xl ring-1 ring-slate-100">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              aria-label="Close"
              className="absolute right-5 top-5 rounded-full p-1.5 text-slate-400 transition hover:bg-slate-50 hover:text-slate-950"
            >
              <X className="h-4 w-4" />
            </button>

            <h3 id="waitlist-title" className={modalTitle}>
              Join the {selectedRole === "Host" ? "Host" : "Guest"} waitlist
            </h3>
            <p className="mt-1 text-sm font-light text-slate-500">
              We&apos;ll reach out once doors open in Dublin.
            </p>

            <form onSubmit={handleWaitlistSubmit} className="mt-6 space-y-4">
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Your name"
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm shadow-sm transition focus:border-[#002FA7] focus:outline-none focus:ring-1 focus:ring-[#002FA7]"
              />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm shadow-sm transition focus:border-[#002FA7] focus:outline-none focus:ring-1 focus:ring-[#002FA7]"
              />
              <div>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  placeholder="Phone, e.g. +353871234567"
                  className={`w-full rounded-2xl border px-4 py-3 text-sm shadow-sm transition focus:outline-none focus:ring-1 ${
                    phoneError
                      ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                      : "border-slate-200 focus:border-[#002FA7] focus:ring-[#002FA7]"
                  }`}
                />
                {phoneError ? <p className="mt-1.5 text-sm text-red-600">{phoneError}</p> : null}
              </div>

              {message ? (
                <div className="space-y-2">
                  <p className={`text-sm ${message.type === "success" ? "text-emerald-600" : "text-red-600"}`}>
                    {message.text}
                  </p>
                  {message.type === "success" && whatsappLink ? (
                    <a
                      href={whatsappLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block text-sm font-medium text-[#002FA7] underline decoration-[#002FA7]/35 underline-offset-4 transition hover:decoration-[#002FA7]"
                    >
                      Message us on WhatsApp instead
                    </a>
                  ) : null}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={submitting || !!phoneError || !phone}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-[#002FA7] py-4 text-sm font-medium text-white shadow-md shadow-[#002FA7]/20 transition hover:bg-[#001e6c] disabled:opacity-50"
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {submitting ? "Submitting…" : "Submit"}
              </button>
            </form>
          </div>
        </div>
      ) : null}
    </WaitlistModalContext.Provider>
  );
}

/** Opens the waitlist modal from server components or links without the React context. */
export function dispatchOpenWaitlistModal(role: WaitlistRole) {
  window.dispatchEvent(new CustomEvent("walkinlocals:open-waitlist", { detail: role }));
}
