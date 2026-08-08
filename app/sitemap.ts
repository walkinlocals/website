import type { MetadataRoute } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

const routes = [
  "",
  "/about-us",
  "/how-it-works",
  "/get-paid",
  "/login",
  "/pay",
  "/privacy",
  "/terms",
  "/guest-directory",
  "/host-directory",
];

export default function sitemap(): MetadataRoute.Sitemap {
  return routes.map((route) => ({
    url: `${BASE_URL}${route}`,
    lastModified: new Date(),
  }));
}
