"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import FeedbackFooter from "@/components/feedback-footer";

export default function HomePage() {
  const supabase = createClient();
  const [isOpen, setIsOpen] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isAuthed, setIsAuthed] = useState(false);
  const [userRole, setUserRole] = useState<"Host" | "Guest" | null>(null);

  const portalRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Check live authentication state to route directory links dynamically
  useEffect(() => {
    async function checkAuth() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setIsAuthed(true);
        const { data } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .maybeSingle();
        setUserRole(data?.role ?? null);
      }
    }
    checkAuth();
  }, [supabase]);

  // Mouse movement tracking for 3D hover portal
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isOpen) return;
      const x = (e.clientX / window.innerWidth) * 2 - 1;
      const y = (e.clientY / window.innerHeight) * 2 - 1;
      setMousePos({ x, y });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
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
    document.getElementById("narrative")?.scrollIntoView({ behavior: "smooth" });
  };

  // Safe programmatic direction helper depending on user auth and role
  const getCtaLink = (targetRole: "Host" | "Guest") => {
    if (!isAuthed) return `/login?mode=signup&role=${targetRole}`;
    if (userRole === "Host") return "/guest-directory";
    return "/host-directory";
  };

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden bg-white font-sans text-slate-900 antialiased selection:bg-[#002FA7]/10 selection:text-[#002FA7]">
      {/* Gentle background aesthetic micro-dots */}
      <div className="pointer-events-none absolute inset-0 z-0 opacity-45 bg-[radial-gradient(#002fa709_1.5px,transparent_1.5px)] [background-size:32px_32px]" />

      {/* SECTION 1: HERO PORTAL */}
      <section className="relative z-10 flex h-screen min-h-screen w-full flex-col justify-between px-4 py-6 sm:px-6">
        <div className="h-4" />

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
                  Explore Open Doors
                </span>
                <span className="text-[10px] uppercase tracking-[0.2em] text-[#002FA7]/60 block mt-1.5 font-mono">✦ Click to enter ✦</span>
              </div>
            </button>

            {/* Door graphic wrapper */}
            <div
              style={{
                transform: isOpen
                  ? "rotateY(-110deg) translateZ(100px) scale(0.95)"
                  : `rotateX(${mousePos.y * -5}deg) rotateY(${mousePos.x * 5}deg) translateZ(0px)`,
                transformStyle: "preserve-3d",
                transformOrigin: "center center",
              }}
              className={`absolute inset-0 z-20 flex items-center justify-center pointer-events-none ${
                isOpen
                  ? "transition-all duration-[1600ms] opacity-0 scale-[0.9] blur-[2px]"
                  : "transition-all duration-[1000ms] opacity-100"
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
      <section id="narrative" className="relative z-10 scroll-mt-0 border-t border-[#002fa7]/10 bg-white py-20 sm:py-[120px]">
        <div className="mx-auto max-w-5xl px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start text-left">
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

      {/* SECTION 4: LIVE CONNECTIONS CALL TO ACTION — hidden when logged in */}
      {!isAuthed && (
      <section className="mx-auto max-w-6xl px-6 py-14 sm:py-24">
        <div className="relative overflow-hidden rounded-3xl border border-[#002fa7]/20 bg-white px-6 py-16 text-center text-slate-950 shadow-[0_20px_50px_rgba(0,47,167,0.03)] sm:px-16">
          <div className="relative z-10 mx-auto max-w-2xl space-y-6">
            <span className="inline-block text-[#002FA7] text-2xl animate-pulse">✦</span>
            <h2 className="font-serif text-3xl font-normal leading-tight text-slate-950 sm:text-5xl">
              There is a place for you at our <span className="italic text-[#002FA7] underline decoration-[#002fa7]/30 decoration-wavy underline-offset-4">table</span>.
            </h2>
            <p className="mx-auto max-w-lg text-sm font-light leading-relaxed text-slate-500 sm:text-base font-sans">
              Our dynamic marketplace is completely live across Dublin. Choose your path below to log in, connect with vetted locals, and share lingering stories.
            </p>

            <div className="flex flex-col items-center justify-center gap-4 pt-4 font-serif text-sm sm:flex-row">
              <Link
                href={getCtaLink("Host")}
                className="w-full rounded-full bg-[#002FA7] px-10 py-4 font-medium text-white text-center shadow-[0_4px_25px_rgba(0,47,167,0.18)] transition-all duration-300 hover:bg-[#001e6c] hover:scale-[1.02] sm:w-auto"
              >
                Become a Dublin Host
              </Link>

              <Link
                href={getCtaLink("Guest")}
                className="w-full rounded-full border border-slate-200 bg-white px-10 py-4 text-slate-600 text-center transition-all duration-300 hover:bg-[#002FA7]/5 hover:text-[#002FA7] hover:border-[#002FA7]/20 hover:scale-[1.02] sm:w-auto"
              >
                Join as a Traveler
              </Link>
            </div>
          </div>
        </div>
      </section>
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