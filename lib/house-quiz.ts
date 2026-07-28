import { homeImage } from "@/lib/home-images";

export type HouseArchetype = "georgian" | "victorian" | "midcentury" | "modern";

/** Option row images: first quiz option → p1, second → p2, etc. */
export const QUIZ_OPTION_IMAGES = [
  homeImage("quiz", "p1.jpg"),
  homeImage("quiz", "p2.webp"),
  homeImage("quiz", "p3.jpeg"),
  homeImage("quiz", "p4.jpg.webp"),
] as const;

const QUIZ_RESULT_IMAGE: Record<HouseArchetype, string> = {
  georgian: QUIZ_OPTION_IMAGES[0],
  victorian: QUIZ_OPTION_IMAGES[1],
  midcentury: QUIZ_OPTION_IMAGES[2],
  modern: QUIZ_OPTION_IMAGES[3],
};

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
    prompt: "You have a free morning in Dublin. What do you want to do?",
    options: [
      {
        label: "Walk past old doors and pretty squares in the city centre",
        scores: { georgian: 3, victorian: 1 },
      },
      {
        label: "Have coffee on a red brick street and watch people pass",
        scores: { victorian: 3, georgian: 1 },
      },
      {
        label: "Walk wide streets with gardens and big windows",
        scores: { midcentury: 3, victorian: 1 },
      },
      {
        label: "Walk by the water near new tall buildings",
        scores: { modern: 3, georgian: 1 },
      },
    ],
  },
  {
    id: "door",
    prompt: "Which front door do you like most?",
    options: [
      {
        label: "A tall old door with bright colour and a brass knocker",
        scores: { georgian: 3 },
      },
      {
        label: "A red brick door with stained glass",
        scores: { victorian: 3 },
      },
      {
        label: "A simple painted door with a small garden out front",
        scores: { midcentury: 3 },
      },
      {
        label: "A modern glass door in a tall building",
        scores: { modern: 3 },
      },
    ],
  },
  {
    id: "interior",
    prompt: "Inside a home, what feels best to you?",
    options: [
      {
        label: "High ceilings and old Dublin style",
        scores: { georgian: 3, victorian: 1 },
      },
      {
        label: "A cosy living room with books and rugs",
        scores: { victorian: 3, midcentury: 1 },
      },
      {
        label: "An open kitchen that opens to a garden",
        scores: { midcentury: 3, modern: 1 },
      },
      {
        label: "Big windows and a clean, bright room",
        scores: { modern: 3 },
      },
    ],
  },
  {
    id: "neighbourhood",
    prompt: "Which area feels right for you?",
    options: [
      {
        label: "Historic streets near museums and squares",
        scores: { georgian: 3 },
      },
      {
        label: "Quiet village streets with cafés",
        scores: { victorian: 3, midcentury: 1 },
      },
      {
        label: "Family areas with parks and shops",
        scores: { midcentury: 3 },
      },
      {
        label: "Busy areas near the docks and new bars",
        scores: { modern: 3 },
      },
    ],
  },
  {
    id: "era",
    prompt: "Which kind of Dublin home do you like?",
    options: [
      {
        label: "Georgian: tall doors and classic city style",
        scores: { georgian: 3 },
      },
      {
        label: "Victorian: red brick and bay windows",
        scores: { victorian: 3 },
      },
      {
        label: "Mid century: semis with gardens",
        scores: { midcentury: 3 },
      },
      {
        label: "Modern: new apartments and glass buildings",
        scores: { modern: 3 },
      },
    ],
  },
  {
    id: "social",
    prompt: "Your ideal visit with a host feels like…",
    options: [
      {
        label: "Tea in a beautiful old room full of stories",
        scores: { georgian: 2, victorian: 2 },
      },
      {
        label: "Talking at the kitchen table while food cooks",
        scores: { victorian: 2, midcentury: 2 },
      },
      {
        label: "Sitting in the garden with snacks and chat",
        scores: { midcentury: 3, victorian: 1 },
      },
      {
        label: "Coffee on a rooftop with a city view",
        scores: { modern: 3 },
      },
    ],
  },
  {
    id: "material",
    prompt: "Which building style do you like?",
    options: [
      {
        label: "Pale stone and white walls",
        scores: { georgian: 3 },
      },
      {
        label: "Warm red brick",
        scores: { victorian: 3 },
      },
      {
        label: "Concrete and pebbledash in the suburbs",
        scores: { midcentury: 3 },
      },
      {
        label: "Glass and steel",
        scores: { modern: 3 },
      },
    ],
  },
  {
    id: "pace",
    prompt: "How do you like to explore?",
    options: [
      {
        label: "Slow walks looking at buildings",
        scores: { georgian: 2, victorian: 2 },
      },
      {
        label: "Wandering village streets until I find a nice spot",
        scores: { victorian: 3 },
      },
      {
        label: "Bus rides to quieter residential areas",
        scores: { midcentury: 3 },
      },
      {
        label: "Following busy streets and new places",
        scores: { modern: 3, georgian: 1 },
      },
    ],
  },
  {
    id: "garden",
    prompt: "Outside space matters to you because…",
    options: [
      {
        label: "I love a small hidden garden in the city",
        scores: { georgian: 2, victorian: 2 },
      },
      {
        label: "A long narrow garden feels very Dublin",
        scores: { victorian: 3 },
      },
      {
        label: "A front and back garden is where life happens",
        scores: { midcentury: 3 },
      },
      {
        label: "A balcony with a view is enough for me",
        scores: { modern: 3 },
      },
    ],
  },
  {
    id: "souvenir",
    prompt: "What do you want to remember from a home visit?",
    options: [
      {
        label: "Stories about the old city",
        scores: { georgian: 3 },
      },
      {
        label: "A local tip and a warm welcome",
        scores: { victorian: 3, midcentury: 1 },
      },
      {
        label: "How real families live in Dublin",
        scores: { midcentury: 3 },
      },
      {
        label: "How Dublin is changing today",
        scores: { modern: 3 },
      },
    ],
  },
];

export const HOUSE_RESULTS: Record<HouseArchetype, HouseResult> = {
  georgian: {
    id: "georgian",
    title: "The Georgian Romantic",
    subtitle: "City centre elegance",
    personality:
      "You love old Dublin in the city centre. Tall doors, pretty colours, and streets full of history speak to you. A home here feels like part of the city’s story.",
    houseDescription:
      "Georgian houses are tall and formal. You see them around Merrion Square, Fitzwilliam Square, and much of the historic centre.",
    image: QUIZ_RESULT_IMAGE.georgian,
    imageAlt: "Georgian building in Dublin",
    areas: ["City Centre", "The Liberties", "Smithfield", "Stoneybatter", "Temple Bar"],
    directoryHint: "Look for hosts in the historic centre and nearby streets.",
  },
  victorian: {
    id: "victorian",
    title: "The Red Brick Dreamer",
    subtitle: "Inner suburb character",
    personality:
      "You like warm red brick streets and village feel. Bay windows, stained glass, and cosy terraces feel like home to you.",
    houseDescription:
      "Victorian red brick fills the inner suburbs past the canals. This is the Dublin many visitors picture when they think of a real local home.",
    image: QUIZ_RESULT_IMAGE.victorian,
    imageAlt: "Red brick house in Dublin",
    areas: ["Rathmines", "Ranelagh", "Portobello", "Terenure", "Drumcondra", "Clontarf", "Sandymount"],
    directoryHint: "Try hosts in Rathmines, Ranelagh, Portobello, Drumcondra, or Clontarf.",
  },
  midcentury: {
    id: "midcentury",
    title: "The Garden Suburb Soul",
    subtitle: "Mid century Dublin life",
    personality:
      "You are curious about everyday Dublin: front gardens, corner shops, and family neighbourhoods away from the busy centre.",
    houseDescription:
      "From the 1930s to the 1970s, Dublin grew with semis and terraces with gardens in the middle ring of the city.",
    image: QUIZ_RESULT_IMAGE.midcentury,
    imageAlt: "Terraced houses with a garden",
    areas: ["Terenure", "Phibsborough", "Glasnevin", "Ballsbridge"],
    directoryHint: "Many hosts live in quieter family neighbourhoods. Ask about their area when you connect.",
  },
  modern: {
    id: "modern",
    title: "The Contemporary Explorer",
    subtitle: "New Dublin, new skylines",
    personality:
      "You like the new Dublin: glass towers, the docks, and talk about where the city is going next.",
    houseDescription:
      "Modern Dublin is strong around the Docklands and in newer apartment areas by the water and canals.",
    image: QUIZ_RESULT_IMAGE.modern,
    imageAlt: "Modern buildings by the waterfront",
    areas: ["Docklands", "Grand Canal Dock", "City Centre", "Sandymount"],
    directoryHint: "Start with hosts in the Docklands or Grand Canal Dock, or city centre apartments.",
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
