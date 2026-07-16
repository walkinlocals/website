/**
 * Approximate centroids for Dublin neighbourhoods.
 *
 * The `profiles` table currently stores a free-text `neighborhood` but no
 * coordinates, so we map that text to an approximate point in order to plot
 * hosts on the map. This is deliberately coarse — good enough to place a home
 * "in Stoneybatter" without ever needing a precise street address.
 *
 * When you later store real `latitude`/`longitude` on profiles, prefer those
 * and treat this as a fallback.
 */

export interface LatLng {
  lat: number;
  lng: number;
}

export const DUBLIN_CENTER: LatLng = { lat: 53.3498, lng: -6.2603 };

const NEIGHBORHOODS: Record<string, LatLng> = {
  stoneybatter: { lat: 53.3498, lng: -6.2891 },
  smithfield: { lat: 53.3477, lng: -6.2783 },
  phibsborough: { lat: 53.36, lng: -6.272 },
  glasnevin: { lat: 53.373, lng: -6.272 },
  drumcondra: { lat: 53.369, lng: -6.256 },
  "the liberties": { lat: 53.341, lng: -6.279 },
  "temple bar": { lat: 53.345, lng: -6.2635 },
  "city centre": { lat: 53.3498, lng: -6.2603 },
  "city center": { lat: 53.3498, lng: -6.2603 },
  portobello: { lat: 53.33, lng: -6.265 },
  rathmines: { lat: 53.323, lng: -6.265 },
  ranelagh: { lat: 53.3255, lng: -6.256 },
  dartry: { lat: 53.313, lng: -6.257 },
  terenure: { lat: 53.308, lng: -6.287 },
  ballsbridge: { lat: 53.328, lng: -6.229 },
  sandymount: { lat: 53.335, lng: -6.213 },
  "grand canal dock": { lat: 53.341, lng: -6.235 },
  docklands: { lat: 53.347, lng: -6.24 },
  clontarf: { lat: 53.363, lng: -6.201 },
  howth: { lat: 53.387, lng: -6.067 },
  "dun laoghaire": { lat: 53.294, lng: -6.136 },
};

/** Resolve a free-text neighbourhood to an approximate point, or null. */
export function neighborhoodCoords(name: string | null | undefined): LatLng | null {
  if (!name) return null;
  return NEIGHBORHOODS[name.trim().toLowerCase()] ?? null;
}

/**
 * Coarsen a coordinate for privacy by rounding. Two decimals ≈ ~1.1km of
 * uncertainty — enough to show a general area without pinpointing anyone.
 */
export function coarsen({ lat, lng }: LatLng, decimals = 2): LatLng {
  const factor = 10 ** decimals;
  return {
    lat: Math.round(lat * factor) / factor,
    lng: Math.round(lng * factor) / factor,
  };
}
