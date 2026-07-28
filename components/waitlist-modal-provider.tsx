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
          text: "✦ Application Received! We review details manually to keep our neighborhood safe. Look out for a welcome message on WhatsApp within 24 hours.",
        });

        const businessNumber = process.env.NEXT_PUBLIC_BUSINESS_WHATSAPP;
        if (businessNumber && selectedRole) {
          const whatsappText = `Hi WALKINLOCALS! I just joined the Dublin ${selectedRole} waitlist. My name is ${fullName}. Can't wait for the neighborhood doors to unlock! ✦`;
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
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm">
          <div
            className="relative w-full max-w-md bg-white rounded-3xl border border-slate-200 p-8 shadow-[0_20px_50px_rgba(0,47,167,0.15)] max-h-[90vh] overflow-y-auto"
          >
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="absolute top-6 right-6 text-slate-400 hover:text-slate-900 font-mono text-[11px] uppercase tracking-wider transition-colors"
            >
              ✦ Close
            </button>

            <h3 className="font-serif text-2xl font-normal text-slate-950 mb-1">
              Join the {selectedRole === "Host" ? "Host" : "Backpacker"} Waitlist
            </h3>
            <p className="text-xs font-light text-slate-500 mb-6">
              We will reach out to you directly once the Dublin neighborhood doors unlock.
            </p>

            <form onSubmit={handleWaitlistSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] uppercase tracking-wider font-semibold text-slate-400 font-mono mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Jane Doe"
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3.5 text-sm text-slate-950 focus:border-[#002FA7] focus:outline-none focus:ring-1 focus:ring-[#002FA7] transition-all font-light"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-wider font-semibold text-slate-400 font-mono mb-1">
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="jane@example.com"
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3.5 text-sm text-slate-950 focus:border-[#002FA7] focus:outline-none focus:ring-1 focus:ring-[#002FA7] transition-all font-light"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-wider font-semibold text-slate-400 font-mono mb-1">
                  Mobile Number
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  placeholder="e.g. +353871234567"
                  className={`w-full rounded-2xl border px-4 py-3.5 text-sm text-slate-950 focus:outline-none focus:ring-1 transition-all font-light ${
                    phoneError
                      ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                      : "border-slate-200 focus:border-[#002FA7] focus:ring-[#002FA7]"
                  }`}
                />
                {phoneError ? (
                  <p className="text-[11px] text-red-500 mt-1.5 font-sans font-light">{phoneError}</p>
                ) : null}
              </div>

              {message ? (
                <div className="space-y-4 mt-3">
                  <p
                    className={`text-xs font-light leading-relaxed ${
                      message.type === "success" ? "text-emerald-600" : "text-red-600"
                    }`}
                  >
                    {message.text}
                  </p>
                  {message.type === "success" && whatsappLink ? (
                    <div className="pt-1">
                      <a
                        href={whatsappLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-xs font-mono font-semibold uppercase tracking-wider text-[#002FA7] hover:text-[#001e6c] hover:underline decoration-wavy transition-all"
                      >
                        ✦ Can&apos;t wait? Drop us a quick message on WhatsApp
                      </a>
                    </div>
                  ) : null}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={submitting || !!phoneError || !phone}
                className="w-full rounded-full bg-[#002FA7] py-3.5 text-xs font-semibold font-mono uppercase tracking-widest text-white transition-all duration-300 hover:bg-[#001e6c] disabled:bg-slate-100 disabled:text-slate-450 disabled:cursor-not-allowed mt-2"
              >
                {submitting ? "Submitting..." : "Submit Application ✦"}
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
