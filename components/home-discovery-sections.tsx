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
  homeSectionBorder,
  homeSectionY,
} from "@/lib/homepage-ui";

function DiscoveryCardTile({ card }: { card: DiscoveryCard }) {
  const content = (
    <>
      <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-slate-200">
        <img
          src={card.image}
          alt=""
          className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
          loading="lazy"
          decoding="async"
        />
      </div>
      <h3 className="mt-3 font-sans text-[15px] font-semibold leading-snug text-slate-950 group-hover:underline">
        {card.title}
      </h3>
      <p className="mt-1 font-sans text-sm leading-snug text-slate-600">{card.subtitle}</p>
    </>
  );

  return (
    <article className="w-[200px] shrink-0 snap-start sm:w-[228px]">
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
      <div className="flex gap-4 pb-3 sm:gap-5">
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
        <div className="mt-8 -mx-6 px-6 sm:mt-10 sm:-mx-8 sm:px-8">
          <DiscoveryCarousel cards={cards} />
        </div>
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
