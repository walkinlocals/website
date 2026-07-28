import { SITE_GUTTER } from "@/lib/page-layout";

/** Shared layout and typography for the marketing homepage. */
export const homeContainer = `w-full ${SITE_GUTTER}`;

export const homeSectionY = "py-16 sm:py-20 lg:py-24";

export const homeSectionBorder = "border-t border-slate-200/80";

/** Shared site title typography — “Home is where you feel loved”. */
export const siteTitleTypography =
  "font-sans font-semibold uppercase tracking-[0.32em] text-[#002FA7]";

export const BRAND_NAME = "WALKINLOCALS";

/** In-body brand — hero typography at the surrounding text size. */
export const brandNameInline = `${siteTitleTypography} text-[length:inherit] leading-[inherit]`;

export const heroTitle = `${siteTitleTypography} text-xl sm:text-2xl lg:text-3xl`;

export const homeEyebrow =
  "font-sans text-xs font-semibold uppercase tracking-[0.22em] text-[#002FA7] sm:text-sm";

export const homeDisplayTitle = heroTitle;

/** Card / footer column titles — same typography, smaller scale. */
export const siteTitleSm = `${siteTitleTypography} text-sm sm:text-base`;

export const homeCardTitle =
  `${siteTitleTypography} mt-4 text-lg leading-snug line-clamp-2 sm:text-xl lg:text-2xl`;

export const homeSectionLead =
  "mt-3 font-sans text-base leading-relaxed text-slate-600 sm:text-lg";

export const homeBody =
  "font-sans text-lg leading-relaxed text-slate-600 sm:text-xl sm:leading-[1.65]";

export const homeTextLink =
  "font-sans text-base font-medium text-[#002FA7] underline decoration-[#002FA7]/35 underline-offset-4 transition hover:decoration-[#002FA7] sm:text-lg";

export const homePrimaryButton =
  "inline-flex items-center justify-center rounded-lg bg-[#002FA7] px-8 py-3.5 font-sans text-base font-semibold text-white transition hover:opacity-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#002FA7] sm:text-lg";

export const marketingBody =
  "font-sans text-lg leading-relaxed text-slate-950 sm:text-xl sm:leading-[1.65]";

export const marketingPageTitle = heroTitle;

export const homeCarouselScroll =
  "overflow-x-auto overscroll-x-contain snap-x snap-mandatory scroll-smooth pb-1 [-ms-overflow-style:none] [scrollbar-width:thin] [scrollbar-color:rgba(0,47,167,0.28)_transparent] [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[#002FA7]/28";

export const quizProgressMeta =
  "font-sans text-2xl leading-snug text-slate-600 sm:text-[1.75rem] sm:leading-[1.65] lg:text-[1.875rem]";

/** Navbar / footer wordmark — same typography as hero tagline. */
export const brandWordmark = `${siteTitleTypography} text-xl sm:text-2xl`;
