export const HOW_IT_WORKS_STEP_IMAGE_CLASS =
  "aspect-[16/10] w-full object-cover sm:aspect-[5/3]";

export const HOMEPAGE_STEPS = [
  {
    number: "1",
    title: "Open the door",
    body: "Discover the homes, hearts, and stories behind Dublin’s doors.",
    image: "/images/works/w1.png",
    imageObject: "top",
  },
  {
    number: "2",
    title: "Come together",
    body: "Share tea, coffee, laughter, and just simple moments that bring people closer.",
    image: "/images/works/w2.jpg",
  },
  {
    number: "3",
    title: "Keep the memory",
    body: "Take away a story, a connection, maybe even a friend who stays with you.",
    image: "/images/works/w3.jpg",
  },
] as const;

export const ABOUT_NARRATIVE = {
  tagline:
    "We believe the best way to discover a place is through the people who call it home.",
  paragraphs: [
    "WALKINLOCALS started with a simple conversation between the three of us.",
    "“How amazing would it be to visit the homes of local people around the world? To step inside, see how they live, and get to know who they really are?”",
    "That’s how WALKINLOCALS was born.",
    "Together, we’re building a community that brings backpackers and local hosts together through real home visits, where a cup of tea or coffee, a homemade local treat, and a good conversation become part of the journey.",
    "We’re starting in Dublin, where we live. Our mission is to create meaningful connections between people around the world, because home is where you feel loved.",
  ],
} as const;
