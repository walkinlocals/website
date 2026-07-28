"use client";

import Navbar from "@/app/components/Navbar";
import SiteFooter from "@/components/site-footer";
import { WaitlistModalProvider } from "@/components/waitlist-modal-provider";

export default function SiteShell({ children }: { children: React.ReactNode }) {
  return (
    <WaitlistModalProvider>
      <Navbar />
      <main className="flex-1 w-full min-w-0">{children}</main>
      <SiteFooter />
    </WaitlistModalProvider>
  );
}
