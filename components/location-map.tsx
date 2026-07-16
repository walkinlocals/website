"use client";

/**
 * A rough-area map using the Google Maps Embed API (place mode). It takes a
 * free-text location ("Stoneybatter, Dublin" or "Lisbon, Portugal") — no exact
 * coordinates — so it's privacy-safe by design. Requires the "Maps Embed API"
 * to be enabled on NEXT_PUBLIC_GOOGLE_MAPS_API_KEY.
 */
export default function LocationMap({
  query,
  zoom = 12,
  label,
}: {
  query: string;
  zoom?: number;
  label?: string;
}) {
  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!key) {
    return (
      <div className="rounded-xl border border-dashed border-stone-300 bg-stone-50 p-4 text-center text-xs text-stone-500">
        Map unavailable — NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is not set.
      </div>
    );
  }

  const src = `https://www.google.com/maps/embed/v1/place?key=${key}&q=${encodeURIComponent(
    query,
  )}&zoom=${zoom}`;

  return (
    <div>
      {label && <p className="mb-1.5 text-xs font-medium text-stone-500">{label}</p>}
      <iframe
        title={label ?? `Map of ${query}`}
        src={src}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        className="h-48 w-full rounded-xl border border-stone-200"
        allowFullScreen
      />
    </div>
  );
}
