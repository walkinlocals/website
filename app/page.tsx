"use client";

import { useEffect, useRef, useState } from "react";
import FeedbackFooter from "@/components/feedback-footer";

export default function HomePage() {
  const [isOpen, setIsOpen] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const portalRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Waitlist Modal States
  const [showModal, setShowModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState<"Host" | "Guest" | null>(null);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Track successful submission to show the optional instant WhatsApp link
  const [whatsappLink, setWhatsappLink] = useState<string | null>(null);

  // Mouse movement tracking for 3D hover
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isOpen) return;

      const x = (e.clientX / window.innerWidth) * 2 - 1;
      const y = (e.clientY / window.innerHeight) * 2 - 1;

      setMousePos({ x, y });
    };

    window.addEventListener("mousemove", handleMouseMove);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, [isOpen]);

  // Gracefully close the door if user manually scrolls back to top
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY < 100 && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isOpen]);

  const handleUnlockPortal = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsOpen(!isOpen);
  };

  const handleDirectScroll = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    document
      .getElementById("narrative")
      ?.scrollIntoView({ behavior: "smooth" });
  };

  // Strict phone validation handler
  const handlePhoneChange = (value: string) => {
    setPhone(value);

    // Regex checks: must start with '+' followed by country code (1-4 digits) and subscriber number (6-14 digits)
    const internationalPhoneRegex = /^\+[1-9]\d{1,3}\d{6,14}$/;

    // Remove space, hyphen, and parenthesis formatting before evaluation
    const cleanValue = value.replace(/[\s\-()]/g, "");

    if (!cleanValue.startsWith("+")) {
      setPhoneError("Number must start with a '+' country prefix (e.g., +353)");
    } else if (!internationalPhoneRegex.test(cleanValue)) {
      setPhoneError("Please enter a valid international number format (e.g., +353871234567)");
    } else {
      setPhoneError(null);
    }
  };

  const openWaitlistModal = (role: "Host" | "Guest") => {
    setSelectedRole(role);
    setShowModal(true);
    setPhone("");
    setPhoneError(null);
    setMessage(null);
    setWhatsappLink(null);
  };

  const handleWaitlistSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Guard submission against lingering formatting errors
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
          phone: cleanPhoneNumber, // Save clean format to database
          roleIntent: selectedRole,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage({ type: "error", text: data.error || "Failed to join waitlist." });
      } else {
        // 1. Set the professional, expectation-setting success text on screen
        setMessage({
          type: "success",
          text: "✦ Application Received! We review details manually to keep our neighborhood safe. Look out for a welcome message on WhatsApp within 24 hours."
        });

        // 2. Safely grab the environmental business line
        const businessNumber = process.env.NEXT_PUBLIC_BUSINESS_WHATSAPP;

        if (businessNumber) {
          const whatsappText = `Hi WalkIn Locals! I just joined the Dublin ${selectedRole} waitlist. My name is ${fullName}. Can't wait for the neighborhood doors to unlock! ✦`;
          const generatedUrl = `https://wa.me/${businessNumber}?text=${encodeURIComponent(whatsappText)}`;
          setWhatsappLink(generatedUrl);
        } else {
          console.error("Missing NEXT_PUBLIC_BUSINESS_WHATSAPP in your environment configuration.");
        }

        // Clear local input fields securely
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

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden bg-white font-sans text-slate-900 antialiased selection:bg-[#002FA7]/10 selection:text-[#002FA7]">

      {/* Gentle background aesthetic micro-dots */}
      <div className="pointer-events-none absolute inset-0 z-0 opacity-45 bg-[radial-gradient(#002fa709_1.5px,transparent_1.5px)] [background-size:32px_32px]" />

      {/* SECTION 1: HERO PORTAL */}
      <section className="relative z-10 flex h-screen min-h-screen w-full flex-col justify-between px-4 py-6 sm:px-6">
        <div className="h-4" />

        {/* Dynamic header message banner */}
        <div className="flex items-center justify-center gap-3 py-3 px-6 mx-auto rounded-full bg-white border border-[#002fa7]/15 font-serif text-xs tracking-wide text-[#002FA7] shadow-[0_4px_20px_rgba(0,47,167,0.03)]">
          <span className="animate-pulse">✦</span>
          <span>
            {isOpen ? "Tap to close the doorway" : "Come on in, tap to make yourself at home"}
          </span>
          <span className="animate-pulse">✦</span>
        </div>

        {/* Portal 3D Frame Container */}
        <div className="relative flex flex-1 items-center justify-center w-full">
          <div
            ref={portalRef}
            onClick={handleUnlockPortal}
            style={{ perspective: "2000px" }}
            className="group relative flex h-[75vh] w-full max-w-[540px] cursor-pointer items-center justify-center"
          >
            <canvas
              ref={canvasRef}
              className={`pointer-events-none absolute inset-0 z-0 transition-opacity duration-1000 ${
                isOpen ? "opacity-100" : "opacity-0"
              }`}
            />

            {/* Step Into Story Button */}
            <button
              onClick={handleDirectScroll}
              className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 flex flex-col items-center justify-center text-center focus:outline-none transition-all duration-[1000ms] ease-out ${
                isOpen
                  ? "opacity-100 scale-100 pointer-events-auto delay-300"
                  : "opacity-0 scale-90 pointer-events-none"
              }`}
            >
              <div className="px-8 py-5 rounded-3xl bg-white border border-[#002FA7]/20 hover:border-[#002FA7] shadow-[0_15px_45px_rgba(0,47,167,0.08)] hover:shadow-[0_20px_50px_rgba(0,47,167,0.15)] transition-all duration-500 hover:scale-[1.03]">
                <span className="font-serif text-xl font-normal tracking-tight text-[#002FA7] block sm:text-2xl">
                  Step into our story
                </span>
                <span className="text-[10px] uppercase tracking-[0.2em] text-[#002FA7]/60 block mt-1.5 font-mono">✦ Click to enter ✦</span>
              </div>
            </button>

            {/* Door graphic wrapper */}
            <div
              style={{
                transform: isOpen
                  ? "rotateY(-110deg) translateZ(100px) scale(0.95)"
                  : `rotateX(${mousePos.y * -5}deg) rotateY(${
                      mousePos.x * 5
                    }deg) translateZ(0px)`,
                transformStyle: "preserve-3d",
                transformOrigin: "center center",
              }}
              className={`absolute inset-0 z-20 flex items-center justify-center pointer-events-none ${
                isOpen
                  ? "transition-all duration-[1600ms] [transition-timing-function:cubic-bezier(0.16,1,0.3,1)] opacity-0 scale-[0.9] blur-[2px]"
                  : "transition-all duration-[1000ms] [transition-timing-function:cubic-bezier(0.16,1,0.3,1)] opacity-100"
              }`}
            >
              <img
                src="/images/logo.png"
                alt="WalkIn Locals"
                className="pointer-events-none block h-full w-auto max-w-full select-none object-contain mix-blend-multiply drop-shadow-[0_20px_45px_rgba(0,47,167,0.06)] transition-transform duration-300 group-hover:scale-[1.01]"
              />
            </div>
          </div>
        </div>

        <div className="h-4" />
      </section>

      {/* SECTION 2: EDITORIAL NARRATIVE */}
      <section
        id="narrative"
        className="relative z-10 scroll-mt-0 border-t border-[#002fa7]/10 bg-white py-20 sm:py-[120px]"
      >
        <div className="mx-auto max-w-5xl px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start text-left">

            {/* Left Narrative Column & Custom Teapot Drawing */}
            <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-28">
              <div className="space-y-3">
                <span className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.3em] text-[#002FA7] font-semibold bg-[#002fa7]/5 px-4 py-1.5 rounded-full">
                  ✦ Our Hearth
                </span>
                <h2 className="font-serif text-4xl font-normal leading-tight tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
                  About Us
                </h2>
              </div>

              <p className="font-serif text-2xl sm:text-3xl text-[#002FA7] italic tracking-tight font-light leading-relaxed">
                We believe the best way to discover a place is through the people who call it home.
              </p>

              <div className="pt-6 opacity-95 flex justify-start">
                <svg
                  width="240"
                  height="160"
                  viewBox="0 0 240 160"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="text-[#002FA7] stroke-current stroke-[1.5] stroke-round stroke-linejoin-round"
                >
                  <polygon points="8,102 232,102 224,114 16,114" />
                  <line x1="22" y1="114" x2="22" y2="152" />
                  <line x1="218" y1="114" x2="218" y2="152" />
                  <path d="M 36,74 C 36,54 50,48 68,48 C 86,48 100,54 100,74 C 100,94 86,102 68,102 C 50,102 36,94 36,74 Z" />
                  <path d="M 40,60 C 24,60 22,86 38,90" />
                  <path d="M 96,66 C 114,64 116,50 116,46 C 116,46 110,60 98,78" />
                  <path d="M 58,48 L 78,48" />
                  <path d="M 64,48 C 64,42 72,42 72,48 Z" className="fill-current" />
                  <path d="M 124,56 L 128,92 C 129,98 135,102 144,102 C 153,102 159,98 160,92 L 164,56 Z" />
                  <path d="M 162,64 C 172,64 174,80 161,84" />
                  <path d="M 140,56 Q 134,66 128,74" />
                  <path d="M 128,74 L 132,77 L 129,81 L 125,78 Z" className="fill-current" />
                  <path d="M 178,102 L 182,98 L 222,98 L 226,102" />
                  <path d="M 182,98 C 182,84 198,82 204,82 C 210,82 214,88 214,98 Z" />
                  <path d="M 183,91 Q 198,93 213,91" />
                  <path d="M 198,98 C 198,86 210,84 218,84 C 224,84 226,90 226,98 Z" />
                  <path d="M 201,92 Q 214,94 225,92" />
                  <path d="M 190,82 C 190,70 204,68 210,68 C 216,68 220,74 220,82 Z" />
                  <path d="M 191,76 Q 205,78 219,75" />
                  <path d="M 202,68 C 202,63 208,63 208,68 Z" className="fill-current" />
                </svg>
              </div>
            </div>

            {/* Right Narrative Body Text Column */}
            <div className="lg:col-span-7 space-y-8 font-serif text-lg font-light leading-relaxed text-slate-650 sm:text-xl">
              <p>WalkIn Locals started with a simple conversation between the three of us.</p>
              <p className="italic text-[#002FA7] font-light leading-relaxed my-8">
                &ldquo;How amazing would it be to visit the homes of local people around the world? To step inside, see how they live, and get to know who they really are?&rdquo;
              </p>
              <p className="italic">That&rsquo;s how WalkIn Locals was born.</p>
              <p>Together, we&rsquo;re building a community that brings travellers and local hosts together through real home visits, where a cup of tea or coffee, a homemade local treat, and a good conversation become part of the journey.</p>
              <p className="pt-2">
                We&rsquo;re starting in Dublin, where we live. Our mission is to create meaningful connections between people around the world, because <span className="italic text-[#002FA7]">home is where you feel loved.</span>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3: SYSTEM PROCESS FLOW */}
      <section className="relative z-10 border-t border-[#002fa7]/10 bg-white py-20 sm:py-28 overflow-hidden">
        <div className="relative z-10 mx-auto max-w-6xl px-6">
          <div className="text-center max-w-xl mx-auto mb-16 space-y-3">
            <span className="inline-flex items-center font-mono text-[10px] uppercase tracking-[0.25em] text-[#002FA7] bg-[#002fa7]/10 px-4 py-1.5 rounded-full font-bold">
              ✦ simple steps ✦
            </span>
            <h2 className="font-serif text-3xl font-normal text-slate-950 sm:text-4xl">
              How we sit down together
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {STEPS.map(({ number, title, body }) => (
              <div
                key={title}
                className="group relative overflow-hidden rounded-3xl border border-[#002fa7]/15 bg-white p-8 shadow-[0_10px_30px_rgba(0,47,167,0.015)] transition-all duration-500 hover:border-[#002fa7] hover:shadow-[0_20px_50px_rgba(0,47,167,0.06)] hover:-translate-y-1.5"
              >
                <div className="mb-8 flex items-center justify-between">
                  <span className="font-serif text-sm italic font-semibold text-[#002FA7] bg-[#002fa7]/5 px-3 py-1 rounded-full">
                    {number}
                  </span>
                  <span className="text-lg text-[#002FA7]/35 transition-transform duration-500 group-hover:scale-125 group-hover:text-[#002FA7]">
                    ✦
                  </span>
                </div>

                <h3 className="mb-3 font-serif text-2xl font-normal text-slate-950 group-hover:text-[#002FA7] transition-colors">{title}</h3>
                <p className="text-sm font-light leading-relaxed text-slate-500 font-sans">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 4: CALL TO ACTION (WAITLIST RECRUITMENT PANELS) */}
      <section className="mx-auto max-w-6xl px-6 py-14 sm:py-24">
        <div className="relative overflow-hidden rounded-3xl border border-[#002fa7]/20 bg-white px-6 py-16 text-center text-slate-950 shadow-[0_20px_50px_rgba(0,47,167,0.03)] sm:px-16">
          <div className="relative z-10 mx-auto max-w-2xl space-y-6">
            <span className="inline-block text-[#002FA7] text-2xl animate-pulse">✦</span>

            <h2 className="font-serif text-3xl font-normal leading-tight text-slate-950 sm:text-5xl">
              There is a place for you at our <span className="italic text-[#002FA7] underline decoration-[#002fa7]/30 decoration-wavy underline-offset-4">table</span>.
            </h2>

            <p className="mx-auto max-w-lg text-sm font-light leading-relaxed text-slate-500 sm:text-base font-sans">
              We're preparing to unlock the doors in Dublin. Join our exclusive pre-launch waitlist to secure your invitation as an early host or traveler.
            </p>

            <div className="flex flex-col items-center justify-center gap-4 pt-4 font-serif text-sm sm:flex-row">
              <button
                onClick={() => openWaitlistModal("Host")}
                className="w-full rounded-full bg-[#002FA7] px-10 py-4 font-medium text-white shadow-[0_4px_25px_rgba(0,47,167,0.18)] transition-all duration-300 hover:bg-[#001e6c] hover:scale-[1.02] sm:w-auto"
              >
                Become a Dublin Host Waitlist
              </button>

              <button
                onClick={() => openWaitlistModal("Guest")}
                className="w-full rounded-full border border-slate-200 bg-white px-10 py-4 text-slate-600 transition-all duration-300 hover:bg-[#002FA7]/5 hover:text-[#002FA7] hover:border-[#002FA7]/20 hover:scale-[1.02] sm:w-auto"
              >
                Join as a Traveler Waitlist
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* DYNAMIC FORM ENTRY MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-md bg-white rounded-3xl border border-slate-200 p-8 shadow-[0_20px_50px_rgba(0,47,167,0.15)] max-h-[90vh] overflow-y-auto">

            {/* Elegant Close Trigger */}
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-6 right-6 text-slate-400 hover:text-slate-900 font-mono text-[11px] uppercase tracking-wider transition-colors"
            >
              ✦ Close
            </button>

            <h3 className="font-serif text-2xl font-normal text-slate-950 mb-1">
              Join the {selectedRole === "Host" ? "Host" : "Traveler"} Waitlist
            </h3>
            <p className="text-xs font-light text-slate-500 mb-6">
              We will reach out to you directly once the Dublin neighborhood doors unlock.
            </p>

            <form onSubmit={handleWaitlistSubmit} className="space-y-4">
              {/* Name field */}
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

              {/* Email field */}
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

              {/* Mobile Number Prefix Input */}
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
                {phoneError && (
                  <p className="text-[11px] text-red-500 mt-1.5 font-sans font-light">
                    {phoneError}
                  </p>
                )}
              </div>

              {/* Dynamic feedback messages & Optional Handshake Link */}
              {message && (
                <div className="space-y-4 mt-3">
                  <p className={`text-xs font-light leading-relaxed ${
                    message.type === "success" ? "text-emerald-600" : "text-red-600"
                  }`}>
                    {message.text}
                  </p>

                  {/* Optional WhatsApp Trigger Link */}
                  {message.type === "success" && whatsappLink && (
                    <div className="pt-1">
                      <a
                        href={whatsappLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-xs font-mono font-semibold uppercase tracking-wider text-[#002FA7] hover:text-[#001e6c] hover:underline decoration-wavy transition-all"
                      >
                        ✦ Can't wait? Drop us a quick message on WhatsApp
                      </a>
                    </div>
                  )}
                </div>
              )}

              {/* Securely locked submission button */}
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
      )}

      <FeedbackFooter />
    </div>
  );
}

const STEPS = [
  {
    number: "First",
    title: "Find your welcome",
    body: "Look through cozy Dublin spots and the friendly folks ready to welcome you in—artists, cooks, and gentle storytellers.",
  },
  {
    number: "Second",
    title: "Sit down together",
    body: "Enjoy quiet, golden hours sharing fresh tea, warm home-baked family recipes, and lovely lingering chats.",
  },
  {
    number: "Third",
    title: "Carry a story home",
    body: "Tuck local stories of Dublin lanes and home-fronts into your pocket to cherish forever.",
  },
] as const;