import { homeImage } from "@/lib/home-images";

export type DiscoveryCard = {
  title: string;
  subtitle: string;
  description: string;
  image: string;
  href?: string;
};

export const TOP_DUBLIN_AREAS: DiscoveryCard[] = [
  {
    title: "Ranelagh",
    subtitle: "South Dublin village",
    description: "Cafés, wine bars, and red-brick streets — a local favourite for a slow afternoon.",
    image: homeImage("areas", "ranelagh.jpg"),
  },
  {
    title: "Rathmines",
    subtitle: "Southside character",
    description: "Independent shops, canal walks, and the buzz of Dublin’s young professional heartland.",
    image: homeImage("areas", "rathm.jpg"),
  },
  {
    title: "Clontarf",
    subtitle: "Bay-side Dublin",
    description: "Seafront promenade, St Anne’s Park nearby, and an easy northside rhythm.",
    image: homeImage("areas", "clontarf.jpg"),
  },
  {
    title: "Malahide",
    subtitle: "Coastal village",
    description: "Marina, castle grounds, and village streets still within Dublin’s reach.",
    image: homeImage("areas", "malahide.jpg"),
  },
  {
    title: "Sutton Beach",
    subtitle: "North bay",
    description: "Wide sands and open sky — Dublin’s quieter edge where the bay meets the horizon.",
    image: homeImage("areas", "burrow.jpg"),
  },
];

export const BEST_BRUNCH_DUBLIN: DiscoveryCard[] = [
  {
    title: "Tang",
    subtitle: "Dawson Street",
    description: "Fresh Middle Eastern plates and bold flavours — a city-centre quick lunch staple.",
    image: homeImage("brunch", "tang.jpg"),
  },
  {
    title: "Alma",
    subtitle: "Portobello",
    description: "Seasonal brunch with a creative edge — worth booking ahead on weekends.",
    image: homeImage("brunch", "alma.jpg"),
  },
  {
    title: "Taste Food Company",
    subtitle: "Dublin",
    description: "Neighbourhood café energy — sandwiches, salads, and proper daytime comfort food.",
    image: homeImage("brunch", "taste.jpg"),
  },
  {
    title: "Olive’s Room",
    subtitle: "Clontarf",
    description: "Cosy northside spot for brunch by the coast — relaxed and reliably good.",
    image: homeImage("brunch", "olive.jpg"),
  },
  {
    title: "NOBO",
    subtitle: "Ranelagh",
    description: "Plant-forward plates and a bright room — a modern brunch pick on the southside.",
    image: homeImage("brunch", "nobo.webp"),
  },
  {
    title: "Amuri",
    subtitle: "City centre",
    description: "Italian-influenced brunch and lunch — pasta, eggs, and a lively central address.",
    image: homeImage("brunch", "amuri.jpeg"),
  },
  {
    title: "Mani",
    subtitle: "City centre",
    description: "All-day dining with Middle Eastern soul — ideal for a quick, satisfying lunch.",
    image: homeImage("brunch", "mani.jpeg"),
  },
];

export const BEST_RESTAURANTS_DUBLIN: DiscoveryCard[] = [
  {
    title: "Host",
    subtitle: "Ranelagh",
    description: "Neighbourhood wine bar with small plates — intimate and always in demand.",
    image: homeImage("restaurants", "host.jpg.webp"),
  },
  {
    title: "Parilla",
    subtitle: "Ranelagh",
    description: "Argentine grill and a warm room — steak, empanadas, and southside buzz.",
    image: homeImage("restaurants", "parilla.jpg"),
  },
  {
    title: "Gloria",
    subtitle: "City centre",
    description: "Pizza and pasta with attitude — loud, fun, and central for a night out.",
    image: homeImage("restaurants", "gloria.jpg"),
  },
  {
    title: "Bonobo",
    subtitle: "Smithfield",
    description: "Creative cooking in the northside market quarter — bold flavours, cool room.",
    image: homeImage("restaurants", "bonobo.jpeg"),
  },
  {
    title: "Opium",
    subtitle: "Portobello",
    description: "Pan-Asian plates and a moody room — dinner with edge on the canal side.",
    image: homeImage("restaurants", "opium.jpg"),
  },
  {
    title: "Masa",
    subtitle: "City centre",
    description: "Japanese-inspired dining downtown — precise flavours and a polished night out.",
    image: homeImage("restaurants", "masa.jpg"),
  },
];

export const NEAR_DUBLIN_WITHIN_HOUR: DiscoveryCard[] = [
  {
    title: "Clontarf & St Anne’s Park",
    subtitle: "In Dublin",
    description: "Rose gardens, woodland paths, and the promenade — a full day without leaving town.",
    image: homeImage("day-trips", "clontarf-st-annes.jpg"),
  },
  {
    title: "Howth",
    subtitle: "~30 min from the city",
    description: "Harbour village, cliff paths, and fish straight off the boat.",
    image: homeImage("day-trips", "howth.jpg"),
  },
  {
    title: "Bray",
    subtitle: "~45 min by DART",
    description: "Coastal promenade and the cliff walk toward Greystones.",
    image: homeImage("day-trips", "bray.jpg"),
  },
  {
    title: "Glendalough & Wicklow",
    subtitle: "~1 hour south",
    description: "Monastic ruins, twin lakes, and Wicklow’s green uplands.",
    image: homeImage("day-trips", "glendalough-wicklow.jpg"),
  },
  {
    title: "Portmarnock Beach",
    subtitle: "~25 min north",
    description: "Long sandy beach and open horizon — easy escape on the northside.",
    image: homeImage("day-trips", "portmarnock-beach.jpg"),
  },
  {
    title: "Greystones",
    subtitle: "~50 min by DART",
    description: "Harbour town, beach walks, and a slower pace down the coast.",
    image: homeImage("day-trips", "greystones.jpg"),
  },
];
