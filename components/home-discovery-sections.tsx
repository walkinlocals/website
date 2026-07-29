"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  BEST_BRUNCH_DUBLIN,
  BEST_RESTAURANTS_DUBLIN,
  TOP_DUBLIN_AREAS,
  type DiscoveryCard,
} from "@/lib/homepage-discovery";
import { CREAM } from "@/lib/brand";
import {
  homeCarouselScroll,
  homeContainer,
  homeDisplayTitle,
  homeCardTitle,
  homeSectionBorder,
  homeSectionY,
} from "@/lib/homepage-ui";
import { SITE_GUTTER } from "@/lib/page-layout";

function DiscoveryCardTile({ card }: { card: DiscoveryCard }) {
  const content = (
    <>
      <div
        className="relative h-[408px] w-full overflow-hidden rounded-xl bg-slate-200 shadow-sm transition-shadow duration-300 group-hover:shadow-lg group-hover:shadow-slate-900/15 sm:h-[480px] lg:h-[552px]"
      >
        <Image
          src={card.image}
          alt=""
          fill
          sizes="(min-width: 1280px) 24vw, (min-width: 1024px) 480px, (min-width: 640px) 432px, 88vw"
          className="object-cover object-center transition duration-300 group-hover:scale-[1.03]"
        />
      </div>
      <h3 className={`${homeCardTitle} group-hover:underline`}>
        {card.title}
      </h3>
      <p className="mt-2 font-sans text-base leading-snug text-slate-600 line-clamp-2 sm:text-lg">
        {card.subtitle}
      </p>
    </>
  );

  return (
    <article className="w-[min(88vw,384px)] shrink-0 snap-start sm:w-[432px] lg:w-[480px] xl:w-[min(24vw,528px)]">
      {card.href ? (
        <Link href={card.href} className="group block">{content}</Link>
      ) : (
        <div className="group">{content}</div>
      )}
    </article>
  );
}

function DiscoveryCarousel({ cards }: { cards: DiscoveryCard[] }) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;

    function updateScrollState() {
      if (!el) return;
      setCanScrollLeft(el.scrollLeft > 4);
      setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
    }

    updateScrollState();
    el.addEventListener("scroll", updateScrollState, { passive: true });
    window.addEventListener("resize", updateScrollState);
    return () => {
      el.removeEventListener("scroll", updateScrollState);
      window.removeEventListener("resize", updateScrollState);
    };
  }, []);

  function scrollByAmount(direction: 1 | -1) {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollBy({ left: direction * el.clientWidth * 0.85, behavior: "smooth" });
  }

  return (
    <div className="relative">
      <div ref={scrollerRef} className={homeCarouselScroll} aria-label="Scroll through listings">
        <div className="flex gap-5 pb-3 sm:gap-6 lg:gap-8">
          {cards.map((card) => (
            <DiscoveryCardTile key={card.title} card={card} />
          ))}
        </div>
      </div>

      {canScrollLeft ? (
        <button
          type="button"
          onClick={() => scrollByAmount(-1)}
          aria-label="Scroll left"
          className="absolute left-1 top-[204px] z-10 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white text-slate-700 shadow-lg ring-1 ring-slate-200 transition hover:text-[#002FA7] sm:top-[240px] sm:flex lg:top-[276px]"
        >
          <ChevronLeft className="h-5 w-5" aria-hidden />
        </button>
      ) : null}

      {canScrollRight ? (
        <button
          type="button"
          onClick={() => scrollByAmount(1)}
          aria-label="Scroll right"
          className="absolute right-1 top-[204px] z-10 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white text-slate-700 shadow-lg ring-1 ring-slate-200 transition hover:text-[#002FA7] sm:top-[240px] sm:flex lg:top-[276px]"
        >
          <ChevronRight className="h-5 w-5" aria-hidden />
        </button>
      ) : null}
    </div>
  );
}

function DiscoverySection({
  id,
  title,
  cards,
  surface,
}: {
  id?: string;
  title: string;
  cards: DiscoveryCard[];
  surface: "cream" | "white";
}) {
  return (
    <section
      id={id}
      className={`${id ? "scroll-mt-24" : ""} ${homeSectionBorder} ${homeSectionY}`}
      style={{ backgroundColor: surface === "cream" ? CREAM : "#ffffff" }}
    >
      <div className={homeContainer}>
        <h2 className={homeDisplayTitle}>{title}</h2>
      </div>
      <div className={`mt-8 sm:mt-10 ${SITE_GUTTER}`}>
        <DiscoveryCarousel cards={cards} />
      </div>
    </section>
  );
}

export default function HomeDiscoverySections() {
  return (
    <div>
      <DiscoverySection
        id="discover"
        title="Must visit spots"
        cards={TOP_DUBLIN_AREAS}
        surface="white"
      />
      <DiscoverySection
        title="Brunch & quick lunch"
        cards={BEST_BRUNCH_DUBLIN}
        surface="cream"
      />
      <DiscoverySection
        title="Best restaurants"
        cards={BEST_RESTAURANTS_DUBLIN}
        surface="white"
      />
    </div>
  );
}
