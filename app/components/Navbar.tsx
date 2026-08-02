import Image from "next/image";
import Link from "next/link";
import { SITE_GUTTER } from "@/lib/page-layout";
import { brandWordmark, BRAND_NAME } from "@/lib/homepage-ui";

export default function Navbar() {
  return (
    <header id="site-navbar" className="sticky top-0 z-50 border-b border-slate-200 bg-white relative">
      <div className={`w-full ${SITE_GUTTER}`}>
        <nav className="flex items-center justify-between gap-2 py-3 sm:gap-6 sm:py-5 lg:py-6">
          <Link href="/" className="flex min-w-0 flex-1 items-center gap-1.5 overflow-hidden sm:gap-3">
            <span className={`${brandWordmark} truncate whitespace-nowrap`}>{BRAND_NAME}</span>
            <Image
              src="/images/logo.png"
              alt=""
              width={48}
              height={48}
              className="h-7 w-7 shrink-0 object-contain sm:h-11 sm:w-11 lg:h-12 lg:w-12"
            />
          </Link>

          <a
            href="#waitlist"
            className="inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-lg bg-[#002FA7] px-3 py-2 text-xs font-semibold text-white transition hover:opacity-95 sm:px-5 sm:py-3 sm:text-base"
          >
            <span className="sm:hidden">Waitlist</span>
            <span className="hidden sm:inline">Join the waitlist</span>
          </a>
        </nav>
      </div>
    </header>
  );
}
