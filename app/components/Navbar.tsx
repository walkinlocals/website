import Image from "next/image";
import Link from "next/link";
import { SITE_GUTTER } from "@/lib/page-layout";
import { brandWordmark, BRAND_NAME } from "@/lib/homepage-ui";

export default function Navbar() {
  return (
    <header id="site-navbar" className="sticky top-0 z-50 border-b border-slate-200 bg-white relative">
      <div className={`w-full ${SITE_GUTTER}`}>
        <nav className="flex min-w-0 items-center gap-2 py-4 sm:gap-6 sm:py-5 lg:py-6">
          <Link href="/" className="flex min-w-0 max-w-full items-center gap-2 sm:gap-3">
            <span className={`${brandWordmark} min-w-0`}>{BRAND_NAME}</span>
            <Image
              src="/images/logo.png"
              alt=""
              width={48}
              height={48}
              className="h-9 w-9 shrink-0 object-contain sm:h-12 sm:w-12"
            />
          </Link>

          <a
            href="#waitlist"
            className="ml-auto inline-flex shrink-0 items-center justify-center rounded-lg bg-[#002FA7] px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-95 sm:px-5 sm:py-3 sm:text-base"
          >
            Join the waitlist
          </a>
        </nav>
      </div>
    </header>
  );
}
