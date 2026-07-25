import { homeImage } from "@/lib/home-images";

export type HouseArchetype = "georgian" | "victorian" | "midcentury" | "modern";

export type QuizScores = Record<HouseArchetype, number>;

export type QuizQuestion = {
  id: string;
  prompt: string;
  options: {
    label: string;
    scores: Partial<QuizScores>;
  }[];
};

export type HouseResult = {
  id: HouseArchetype;
  title: string;
  subtitle: string;
  personality: string;
  houseDescription: string;
  image: string;
  imageAlt: string;
  imageCredit?: string;
  areas: string[];
  directoryHint: string;
};

export const HOUSE_QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: "morning",
    prompt: "It’s your first free morning in Dublin. What sounds most like you?",
    options: [
      {
        label: "A quiet stroll past fanlit doors and iron railings near a leafy square",
        scores: { georgian: 3, victorian: 1 },
      },
      {
        label: "Coffee on a red-brick terrace, watching the street wake up",
        scores: { victorian: 3, georgian: 1 },
      },
      {
        label: "A long walk through wide avenues with front gardens and bay windows",
        scores: { midcentury: 3, victorian: 1 },
      },
      {
        label: "A waterfront wander among glass towers and converted warehouses",
        scores: { modern: 3, georgian: 1 },
      },
    ],
  },
  {
    id: "door",
    prompt: "Which front door would you pause to admire?",
    options: [
      {
        label: "A tall Georgian door in deep heritage colour with a brass knocker",
        scores: { georgian: 3 },
      },
      {
        label: "A Victorian red-brick entrance with stained glass and a tiled step",
        scores: { victorian: 3 },
      },
      {
        label: "A painted semi-detached door with a neat hedge and a bicycle outside",
        scores: { midcentury: 3 },
      },
      {
        label: "A sleek lobby entrance with clean lines and city views",
        scores: { modern: 3 },
      },
    ],
  },
  {
    id: "interior",
    prompt: "Stepping inside, what feels most inviting?",
    options: [
      {
        label: "High ceilings, cornices, and a sense of old Dublin grandeur",
        scores: { georgian: 3, victorian: 1 },
      },
      {
        label: "A warm living room with bookshelves, rugs, and layered family history",
        scores: { victorian: 3, midcentury: 1 },
      },
      {
        label: "An open-plan kitchen-diner that spills into a back garden",
        scores: { midcentury: 3, modern: 1 },
      },
      {
        label: "Floor-to-ceiling windows and a minimalist, light-filled space",
        scores: { modern: 3 },
      },
    ],
  },
  {
    id: "neighbourhood",
    prompt: "Which neighbourhood energy draws you in?",
    options: [
      {
        label: "Historic, cultured, and walkable — museums and squares nearby",
        scores: { georgian: 3 },
      },
      {
        label: "Village-y, leafy, and lived-in — cafés tucked between terraces",
        scores: { victorian: 3, midcentury: 1 },
      },
      {
        label: "Family-friendly and grounded — schools, parks, and corner shops",
        scores: { midcentury: 3 },
      },
      {
        label: "Young, buzzing, and forward-looking — docks, startups, nightlife",
        scores: { modern: 3 },
      },
    ],
  },
  {
    id: "era",
    prompt: "If you could time-travel through Dublin’s housing history, you’d stop at…",
    options: [
      {
        label: "The Georgian era — symmetry, fanlights, and city elegance",
        scores: { georgian: 3 },
      },
      {
        label: "The Victorian & Edwardian boom — red brick and bay windows",
        scores: { victorian: 3 },
      },
      {
        label: "The mid-century suburbs — semis, gardens, and community life",
        scores: { midcentury: 3 },
      },
      {
        label: "Today’s Dublin — apartments, redevelopments, and new skylines",
        scores: { modern: 3 },
      },
    ],
  },
  {
    id: "social",
    prompt: "Your ideal host visit feels like…",
    options: [
      {
        label: "Tea in a beautifully worn drawing room full of stories",
        scores: { georgian: 2, victorian: 2 },
      },
      {
        label: "Chatting at a kitchen table while something simmers on the hob",
        scores: { victorian: 2, midcentury: 2 },
      },
      {
        label: "Sitting in the garden with homemade treats and neighbourhood gossip",
        scores: { midcentury: 3, victorian: 1 },
      },
      {
        label: "A rooftop coffee with panoramic views and bold conversation",
        scores: { modern: 3 },
      },
    ],
  },
  {
    id: "material",
    prompt: "Which building material speaks to you most?",
    options: [
      {
        label: "Limestone and stucco — pale, formal, timeless",
        scores: { georgian: 3 },
      },
      {
        label: "Red brick — warm, textured, unmistakably Dublin",
        scores: { victorian: 3 },
      },
      {
        label: "Pebbledash and concrete — honest, suburban, familiar",
        scores: { midcentury: 3 },
      },
      {
        label: "Glass and steel — bright, urban, contemporary",
        scores: { modern: 3 },
      },
    ],
  },
  {
    id: "pace",
    prompt: "How do you like to explore a city?",
    options: [
      {
        label: "Slowly, on foot, noticing architectural details on every street",
        scores: { georgian: 2, victorian: 2 },
      },
      {
        label: "Wandering village streets until you find the perfect local spot",
        scores: { victorian: 3 },
      },
      {
        label: "Taking the bus out to quieter residential pockets for contrast",
        scores: { midcentury: 3 },
      },
      {
        label: "Following the energy — canals, docks, and what’s new",
        scores: { modern: 3, georgian: 1 },
      },
    ],
  },
  {
    id: "garden",
    prompt: "Outside space matters to you because…",
    options: [
      {
        label: "I love a hidden courtyard or small walled garden in the city",
        scores: { georgian: 2, victorian: 2 },
      },
      {
        label: "A long narrow Victorian garden feels wonderfully Dublin",
        scores: { victorian: 3 },
      },
      {
        label: "A real front and back garden is where life happens",
        scores: { midcentury: 3 },
      },
      {
        label: "A balcony or shared terrace with a view is enough for me",
        scores: { modern: 3 },
      },
    ],
  },
  {
    id: "souvenir",
    prompt: "What would you most want to take home from a Dublin home visit?",
    options: [
      {
        label: "A story about who lived behind those tall windows centuries ago",
        scores: { georgian: 3 },
      },
      {
        label: "A recipe, a local tip, and the feeling of being welcomed in",
        scores: { victorian: 3, midcentury: 1 },
      },
      {
        label: "A glimpse of everyday Dublin family life away from the postcards",
        scores: { midcentury: 3 },
      },
      {
        label: "A fresh perspective on how Dublin is changing right now",
        scores: { modern: 3 },
      },
    ],
  },
];

export const HOUSE_RESULTS: Record<HouseArchetype, HouseResult> = {
  georgian: {
    id: "georgian",
    title: "The Georgian Romantic",
    subtitle: "City-centre elegance",
    personality:
      "You’re drawn to history with a pulse — grand proportions, fanlit doors, and the quiet drama of Dublin’s historic core. You notice symmetry, colour, and the stories embedded in stone. For you, a home isn’t just shelter; it’s a chapter in the city’s past.",
    houseDescription:
      "Georgian townhouses dominate Dublin’s city centre — tall, formal, and unmistakable. Streets around Merrion Square, Fitzwilliam Square, Mountjoy Square, and Henrietta Street are built almost entirely in this style.",
    image: homeImage("quiz", "georgian.jpeg"),
    imageAlt: "Georgian building with classic Dublin architecture",
    areas: ["City Centre", "The Liberties", "Smithfield", "Stoneybatter", "Temple Bar"],
    directoryHint: "Look for hosts in the historic core and its fringes — where Dublin’s grandest doors still open onto real lives.",
  },
  victorian: {
    id: "victorian",
    title: "The Red-Brick Dreamer",
    subtitle: "Inner-suburb character",
    personality:
      "You love warmth, texture, and the lived-in charm of Dublin’s village streets. Bay windows, stained glass, and long terraces feel like home to you — not museum pieces, but places where tea, conversation, and neighbourhood life still flourish.",
    houseDescription:
      "Victorian and Edwardian red-bricks fill the inner suburbs just beyond the canals — multi-storey terraces with personality in every brick. This is the Dublin most visitors picture when they imagine a real local home.",
    image: homeImage("quiz", "victorian.jpeg"),
    imageAlt: "Red-brick house with a car parked out front",
    areas: ["Rathmines", "Ranelagh", "Portobello", "Terenure", "Drumcondra", "Clontarf", "Sandymount"],
    directoryHint: "Browse hosts in the inner suburbs — Rathmines, Ranelagh, Portobello, Drumcondra, and Clontarf are classic starting points.",
  },
  midcentury: {
    id: "midcentury",
    title: "The Garden Suburb Soul",
    subtitle: "Mid-century Dublin life",
    personality:
      "You’re curious about the Dublin tourists rarely see — the everyday city of front gardens, corner shops, and families who’ve stayed for generations. You value space, honesty, and the unpretentious beauty of suburban Dublin.",
    houseDescription:
      "From the 1930s to the 1970s, Dublin’s middle ring filled with semi-detached and terraced corporation housing — concrete, pebbledash, and generous gardens replacing the red-bricks further in.",
    image: homeImage("quiz", "midcentury.jpeg"),
    imageAlt: "Old terraced houses with a hedge and gate in front",
    areas: ["Terenure", "Phibsborough", "Glasnevin", "Ballsbridge"],
    directoryHint:
      "Hosts across Dublin’s residential belts often open doors in these quieter, family-rooted neighbourhoods — ask about their area when you connect.",
  },
  modern: {
    id: "modern",
    title: "The Contemporary Explorer",
    subtitle: "New Dublin, new skylines",
    personality:
      "You’re energised by a city in motion — glass, light, converted docks, and the Dublin that’s still being built. You want conversations about where the city is going, not only where it’s been.",
    houseDescription:
      "Modern Dublin clusters around the Docklands and outer suburbs — apartment complexes, duplexes, and redeveloped waterfronts where 21st-century life meets the Liffey and the bay.",
    image: homeImage("quiz", "modern.jpeg"),
    imageAlt: "Waterfront with modern buildings in the background",
    areas: ["Docklands", "Grand Canal Dock", "City Centre", "Sandymount"],
    directoryHint: "Start with hosts in the Docklands and Grand Canal Dock — or city-centre hosts in newer apartment living.",
  },
};

export function emptyScores(): QuizScores {
  return { georgian: 0, victorian: 0, midcentury: 0, modern: 0 };
}

export function computeScores(answerIndices: number[]): QuizScores {
  const scores = emptyScores();
  answerIndices.forEach((optionIndex, questionIndex) => {
    const question = HOUSE_QUIZ_QUESTIONS[questionIndex];
    const option = question?.options[optionIndex];
    if (!option) return;
    for (const [key, value] of Object.entries(option.scores) as [HouseArchetype, number][]) {
      scores[key] += value;
    }
  });
  return scores;
}

export function getTopArchetype(scores: QuizScores): HouseArchetype {
  return (Object.entries(scores).sort(([, a], [, b]) => b - a)[0]?.[0] ??
    "victorian") as HouseArchetype;
}
