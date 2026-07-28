import {
  BEST_BRUNCH_DUBLIN,
  BEST_RESTAURANTS_DUBLIN,
  TOP_DUBLIN_AREAS,
} from "@/lib/homepage-discovery";

export type SiteSearchResult = {
  id: string;
  title: string;
  description: string;
  href: string;
  group: string;
  score: number;
};

type SearchEntry = {
  id: string;
  title: string;
  description: string;
  href: string;
  group: string;
  terms: string;
};

const STATIC_PAGES: Omit<SearchEntry, "terms">[] = [
  { id: "page-home", title: "Home", description: "Discover Dublin hosts and local home visits", href: "/", group: "Pages" },
  { id: "page-about", title: "About us", description: "The story behind WALKINLOCALS", href: "/about-us", group: "Pages" },
  { id: "page-how", title: "How it works", description: "Connect, visit, and get paid as a host", href: "/how-it-works", group: "Pages" },
  { id: "page-quiz", title: "House quiz", description: "Which Dublin house type are you?", href: "/quiz", group: "Pages" },
  { id: "page-pay", title: "Pay", description: "Connection fees for backpackers", href: "/pay", group: "Pages" },
  { id: "page-get-paid", title: "Get paid", description: "Host payouts through Stripe", href: "/get-paid", group: "Pages" },
  { id: "page-matches", title: "Matches", description: "Your connection requests and visits", href: "/matches", group: "App" },
  { id: "page-profile", title: "Profile", description: "Your account and directory settings", href: "/profile", group: "App" },
  { id: "page-hosts", title: "Browse hosts", description: "Dublin hosts open for home visits", href: "/host-directory", group: "App" },
  { id: "page-guests", title: "Browse guests", description: "Backpackers looking for local hosts", href: "/guest-directory", group: "App" },
  { id: "page-waitlist", title: "Join waitlist", description: "Pre-launch host and guest waitlist", href: "/#waitlist", group: "Waitlist" },
  { id: "page-terms", title: "Terms of service", description: "Legal terms and liability release", href: "/terms", group: "Legal" },
];

function discoveryEntries(
  cards: typeof TOP_DUBLIN_AREAS,
  group: string,
  href: string,
  prefix: string,
): Omit<SearchEntry, "terms">[] {
  return cards.map((card, index) => ({
    id: `${prefix}-${index}`,
    title: card.title,
    description: `${card.subtitle}. ${card.description}`,
    href: card.href ?? href,
    group,
  }));
}

function buildIndex(): SearchEntry[] {
  const entries: Omit<SearchEntry, "terms">[] = [
    ...STATIC_PAGES,
    ...discoveryEntries(TOP_DUBLIN_AREAS, "Areas", "/#discover", "area"),
    ...discoveryEntries(BEST_BRUNCH_DUBLIN, "Brunch", "/#discover", "brunch"),
    ...discoveryEntries(BEST_RESTAURANTS_DUBLIN, "Restaurants", "/#discover", "restaurant"),
  ];

  return entries.map((entry) => ({
    ...entry,
    terms: `${entry.title} ${entry.description} ${entry.group}`.toLowerCase(),
  }));
}

const SEARCH_INDEX = buildIndex();

function tokenize(query: string): string[] {
  return query
    .toLowerCase()
    .trim()
    .split(/\s+/)
    .filter((t) => t.length >= 2);
}

function scoreEntry(entry: SearchEntry, tokens: string[], raw: string): number {
  if (!raw) return 0;
  const title = entry.title.toLowerCase();
  let score = 0;

  if (title === raw) score += 100;
  if (title.startsWith(raw)) score += 50;
  if (title.includes(raw)) score += 30;

  for (const token of tokens) {
    if (title.includes(token)) score += 20;
    if (entry.terms.includes(token)) score += 8;
  }

  return score;
}

export function searchSite(query: string, limit = 10): SiteSearchResult[] {
  const raw = query.toLowerCase().trim();
  if (raw.length < 2) return [];

  const tokens = tokenize(query);

  const scored = SEARCH_INDEX
    .map((entry) => ({
      id: entry.id,
      title: entry.title,
      description: entry.description,
      href: entry.href,
      group: entry.group,
      score: scoreEntry(entry, tokens, raw),
    }))
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return scored;
}

export function directorySearchHref(role: "Host" | "Guest", query: string): string {
  const base = role === "Host" ? "/host-directory" : "/guest-directory";
  const q = query.trim();
  if (!q) return base;
  return `${base}?q=${encodeURIComponent(q)}`;
}
