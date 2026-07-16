import type { Metadata } from "next";
import "./globals.css";
import Navbar from "./components/Navbar";
import { Heart } from "lucide-react";

export const metadata: Metadata = {
  title: "Walkinlocals — Dublin",
  description:
    "A curated marketplace connecting travelers with local Dublin hosts for storytelling experiences over tea, coffee, and traditional treats.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className="flex min-h-screen flex-col text-slate-950 antialiased"
        style={{ backgroundColor: "#ffffff" }}
      >
        <Navbar />
        <main className="flex-1">{children}</main>

        {/* Sleek footer matching the rest of the site with forced white background */}
        <footer
          className="border-t border-slate-100"
          style={{ backgroundColor: "#ffffff" }}
        >
          <div className="mx-auto max-w-6xl px-6 py-8 text-center text-sm text-slate-500">
            {/* Top row containing the brand-blue heart icon */}
            <div className="flex items-center justify-center gap-1">
              <span>Made with</span>
              <Heart
                className="h-3.5 w-3.5 animate-pulse"
                style={{ fill: "#002FA7", stroke: "#002FA7" }}
              />
              <span>in Dublin by Pam, Ughroxx &amp; Sammy</span>
            </div>

            {/* Fine print containing the brand name */}
            <div className="mt-2 text-xs text-slate-400 font-light">
              &copy; {new Date().getFullYear()} Walkinlocals. All rights reserved.
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}