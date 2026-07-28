import type { Metadata } from "next";
import "./globals.css";
import Navbar from "./components/Navbar";
import { PageToastProvider } from "@/components/page-toast";
import LiveNotifications from "@/components/live-notifications";
import SiteFooter from "@/components/site-footer";

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
        <PageToastProvider>
          <Navbar />
          <LiveNotifications />
          <main className="flex-1 w-full min-w-0">{children}</main>
          <SiteFooter />
        </PageToastProvider>
      </body>
    </html>
  );
}
