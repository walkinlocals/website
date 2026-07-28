import type { Metadata } from "next";
import "./globals.css";
import SiteShell from "@/components/site-shell";

export const metadata: Metadata = {
  title: "WALKINLOCALS Dublin",
  description:
    "A curated marketplace connecting backpackers with local Dublin hosts for storytelling experiences over tea, coffee, and traditional treats.",
  robots: {
    index: true,
    follow: true,
  },
  verification: {
    google: "_Y7CMB4cTH5nTJgLvFOfZVcyJvERQu6iw-KUdECyHuw",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col text-slate-950 antialiased bg-white">
        <SiteShell>{children}</SiteShell>
      </body>
    </html>
  );
}
