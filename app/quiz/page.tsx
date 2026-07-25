"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import HouseQuiz from "@/components/house-quiz";

export default function QuizPage() {
  const supabase = createClient();
  const [hostsDirectoryHref, setHostsDirectoryHref] = useState("/login?mode=signup&role=Guest");

  useEffect(() => {
    async function checkAuth() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
      if (data?.role === "Host") {
        setHostsDirectoryHref("/guest-directory");
      } else {
        setHostsDirectoryHref("/host-directory");
      }
    }
    checkAuth();
  }, [supabase]);

  return (
    <div className="min-h-screen bg-white">
      <div className="border-b border-slate-100 bg-[#faf9f6]">
        <div className="mx-auto max-w-6xl px-6 py-10 sm:py-14">
          <Link href="/" className="font-sans text-sm text-[#002FA7] hover:underline">
            ← Back to home
          </Link>
          <h1 className="mt-6 max-w-2xl font-serif text-3xl font-normal text-slate-950 sm:text-4xl">
            Which Dublin house are you?
          </h1>
          <p className="mt-3 max-w-xl font-sans text-sm font-light leading-relaxed text-slate-600">
            Answer a few questions about how you like to live and travel — we&apos;ll match you to a Dublin home style
            and neighbourhoods to explore with locals.
          </p>
        </div>
      </div>
      <HouseQuiz hostsDirectoryHref={hostsDirectoryHref} embedded />
    </div>
  );
}
