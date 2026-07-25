import Link from "next/link";
import { ABOUT_NARRATIVE } from "@/lib/marketing-content";
import { KLEIN_BLUE, CREAM } from "@/lib/brand";

type AboutNarrativeProps = {
  showReadMore?: boolean;
  brief?: boolean;
  asymmetric?: boolean;
};

export default function AboutNarrative({
  showReadMore = false,
  brief = false,
  asymmetric = false,
}: AboutNarrativeProps) {
  if (brief && asymmetric) {
    return (
      <section id="narrative" className="py-20 sm:py-28" style={{ backgroundColor: CREAM }}>
        <div className="mx-auto grid max-w-6xl gap-12 px-6 lg:grid-cols-12 lg:gap-8 lg:items-start">
          <div className="lg:col-span-5">
            <h2 className="font-serif text-4xl font-normal tracking-tight text-slate-950 sm:text-5xl">About us</h2>
            <p
              className="mt-8 font-serif text-xl font-light italic leading-snug sm:text-2xl lg:mt-10"
              style={{ color: KLEIN_BLUE }}
            >
              {ABOUT_NARRATIVE.tagline}
            </p>
          </div>
          <div className="lg:col-span-6 lg:col-start-7 lg:pt-2">
            <p className="font-sans text-base font-light leading-relaxed text-slate-600 sm:text-lg sm:leading-relaxed">
              {ABOUT_NARRATIVE.paragraphs[0]} We&apos;re building real home visits in Dublin — tea, conversation, and
              connections that last beyond the trip.
            </p>
            <Link
              href="/about-us"
              className="mt-10 inline-block font-sans text-sm font-medium underline decoration-[#002FA7]/35 underline-offset-[6px] hover:decoration-[#002FA7]"
              style={{ color: KLEIN_BLUE }}
            >
              Read our full story →
            </Link>
          </div>
        </div>
      </section>
    );
  }

  if (brief) {
    return (
      <section id="narrative" className="border-t border-slate-100 bg-white py-14 sm:py-20">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="font-serif text-3xl font-normal tracking-tight text-slate-950 sm:text-4xl">About Us</h2>
          <p className="mt-4 font-serif text-lg font-light italic text-[#002FA7] sm:text-xl">{ABOUT_NARRATIVE.tagline}</p>
          <p className="mt-4 font-sans text-sm font-light leading-relaxed text-slate-600 sm:text-base">
            {ABOUT_NARRATIVE.paragraphs[0]} We&apos;re building real home visits in Dublin — tea, conversation, and
            connections that last beyond the trip.
          </p>
          <Link
            href="/about-us"
            className="mt-6 inline-flex items-center gap-2 font-sans text-sm font-medium text-[#002FA7] underline decoration-[#002fa7]/30 underline-offset-4 hover:decoration-[#002FA7]"
          >
            Read our full story
            <span aria-hidden>→</span>
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section id="narrative" className="relative z-10 scroll-mt-0 border-t border-[#002fa7]/10 bg-white py-20 sm:py-[120px]">
      <div className="mx-auto max-w-5xl px-6">
        <div className="grid grid-cols-1 items-start gap-12 text-left lg:grid-cols-12">
          <div className="space-y-6 lg:sticky lg:top-28 lg:col-span-5">
            <div className="space-y-3">
              <h2 className="font-serif text-4xl font-normal leading-tight tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
                About Us
              </h2>
            </div>

            <p className="font-serif text-2xl font-light italic leading-relaxed tracking-tight text-[#002FA7] sm:text-3xl">
              {ABOUT_NARRATIVE.tagline}
            </p>

            {showReadMore ? (
              <Link
                href="/about-us"
                className="inline-flex items-center gap-2 font-serif text-sm text-[#002FA7] underline decoration-[#002fa7]/30 underline-offset-4 transition hover:decoration-[#002FA7]"
              >
                Read our full story
                <span aria-hidden>→</span>
              </Link>
            ) : null}

            <div className="flex justify-start pt-6 opacity-95">
              <svg
                width="240"
                height="160"
                viewBox="0 0 240 160"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="stroke-round stroke-linejoin-round stroke-current stroke-[1.5] text-[#002FA7]"
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

          <div className="space-y-8 font-serif text-lg font-light leading-relaxed text-slate-650 sm:text-xl lg:col-span-7">
            <p>{ABOUT_NARRATIVE.paragraphs[0]}</p>
            <p className="my-8 font-light italic leading-relaxed text-[#002FA7]">
              &ldquo;{ABOUT_NARRATIVE.paragraphs[1].slice(1, -1)}&rdquo;
            </p>
            <p className="italic">{ABOUT_NARRATIVE.paragraphs[2]}</p>
            <p>{ABOUT_NARRATIVE.paragraphs[3]}</p>
            <p className="pt-2">
              We&apos;re starting in Dublin, where we live. Our mission is to create meaningful connections between
              people around the world, because{" "}
              <span className="italic text-[#002FA7]">home is where you feel loved.</span>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
