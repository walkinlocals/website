/** Base path for marketing homepage photos under `public/images/home/`. */
export const HOME_IMAGES_BASE = "/images/home";

export function homeImage(
  section: "areas" | "brunch" | "restaurants" | "quiz",
  filename: string,
) {
  return `${HOME_IMAGES_BASE}/${section}/${filename}`;
}
