"use client";

import Link from "next/link";
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
        className="relative h-[408px] w-full overflow-hidden rounded-xl bg-slate-200 sm:h-[480px] lg:h-[552px]"
      >
        <img
          src={card.image}
          alt=""
          className="absolute inset-0 h-full w-full object-cover object-center transition duration-300 group-hover:scale-[1.03]"
          loading="lazy"
          decoding="async"
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
  return (
    <div className={homeCarouselScroll} aria-label="Scroll through listings">
      <div className="flex gap-5 pb-3 sm:gap-6 lg:gap-8">
        {cards.map((card) => (
          <DiscoveryCardTile key={card.title} card={card} />
        ))}
      </div>
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
      <div className={`mt-8 sm:mt-10 ${homeCarouselScroll} ${SITE_GUTTER}`}>
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
