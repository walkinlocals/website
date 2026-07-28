/** Horizontal padding for full-width pages (no max-width column). */
export const SITE_GUTTER = "px-6 sm:px-10 lg:px-14 xl:px-[5vw] 2xl:px-[6vw]";

/** Shared authenticated page shell widths and backgrounds. */
export const PAGE_BG_DOTS =
  "pointer-events-none absolute inset-0 z-0 opacity-30 bg-[radial-gradient(#002fa709_1.5px,transparent_1.5px)] [background-size:32px_32px]";

export const PAGE_SHELL =
  "bg-white min-h-screen w-full relative selection:bg-[#002FA7] selection:text-white overflow-x-hidden";

export const PAGE_CONTAINER = `relative z-10 w-full ${SITE_GUTTER}`;

/** Full-width main column with site gutter (no forced min-height — avoids huge empty bands). */
export const PAGE_MAIN = `${PAGE_CONTAINER} py-14 sm:py-20 lg:py-24`;
