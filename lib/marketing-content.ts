import {
  HOST_PAYOUT_EUR,
  MATCH_FEE_EUR,
  PLATFORM_FEE_CENTS,
} from "@/lib/pricing";

const PLATFORM_FEE_EUR = PLATFORM_FEE_CENTS / 100;

export const HOMEPAGE_STEPS = [
  {
    number: "First Step",
    title: "Open the door",
    body: "Discover the homes, hearts, and stories behind Dublin’s doors.",
  },
  {
    number: "Second Step",
    title: "Come together",
    body: "Share tea, coffee, laughter, and just simple moments that bring people closer.",
  },
  {
    number: "Third Step",
    title: "Keep the memory",
    body: "Take away a story, a connection, maybe even a friend who stays with you.",
  },
] as const;

export const GALLERY_IMAGES = [
  {
    src: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=900&q=80",
    alt: "Charming Dublin home exterior",
    className: "md:col-span-2 md:row-span-2",
  },
  {
    src: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=700&q=80",
    alt: "Lush garden in bloom",
    className: "",
  },
  {
    src: "https://images.unsplash.com/photo-1598902108854-10e335adac99?w=700&q=80",
    alt: "Cozy living room with warm light",
    className: "",
  },
  {
    src: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=700&q=80",
    alt: "Welcoming family home",
    className: "",
  },
  {
    src: "https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=900&q=80",
    alt: "Peaceful backyard garden",
    className: "md:col-span-2",
  },
] as const;

export const ABOUT_NARRATIVE = {
  tagline:
    "We believe the best way to discover a place is through the people who call it home.",
  paragraphs: [
    "WalkIn Locals started with a simple conversation between the three of us.",
    "“How amazing would it be to visit the homes of local people around the world? To step inside, see how they live, and get to know who they really are?”",
    "That’s how WalkIn Locals was born.",
    "Together, we’re building a community that brings travellers and local hosts together through real home visits, where a cup of tea or coffee, a homemade local treat, and a good conversation become part of the journey.",
    "We’re starting in Dublin, where we live. Our mission is to create meaningful connections between people around the world, because home is where you feel loved.",
  ],
} as const;

export const HOST_PAYOUT_COPY = {
  headline: "Get paid to share your home",
  feePerGuest: HOST_PAYOUT_EUR,
  platformFee: PLATFORM_FEE_EUR,
  connectionFee: MATCH_FEE_EUR,
} as const;

export const GUEST_PAY_COPY = {
  headline: "Pay once, connect for real",
  feePerGuest: MATCH_FEE_EUR,
  hostShare: HOST_PAYOUT_EUR,
} as const;
