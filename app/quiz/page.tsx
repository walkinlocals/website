"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import HouseQuiz from "@/components/house-quiz";
import { PAGE_CONTAINER, PAGE_SHELL } from "@/lib/page-layout";
import { homeTextLink, marketingPageTitle } from "@/lib/homepage-ui";
import { quizNextStepForAudience, type QuizNextStep } from "@/lib/quiz-next-step";
import type { AppRole } from "@/lib/profile-role";

const VISITOR_NEXT_STEP = quizNextStepForAudience(false, null);

export default function QuizPage() {
  const supabase = createClient();
  const [authReady, setAuthReady] = useState(false);
  const [nextStep, setNextStep] = useState<QuizNextStep>(VISITOR_NEXT_STEP);

  useEffect(() => {
    let active = true;

    async function checkAuth() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!active) return;

      if (!user) {
        setNextStep(quizNextStepForAudience(false, null));
        setAuthReady(true);
        return;
      }

      const { data } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
      if (!active) return;

      setNextStep(quizNextStepForAudience(true, data?.role as AppRole | null));
      setAuthReady(true);
    }

    checkAuth();

    return () => {
      active = false;
    };
  }, [supabase]);

  return (
    <div className={`${PAGE_SHELL} font-sans text-slate-950`}>
      <div className={`${PAGE_CONTAINER} py-14 sm:py-20 lg:py-24`}>
        <div className="mx-auto w-full max-w-4xl lg:max-w-5xl">
          <Link href="/" className={homeTextLink}>
            ← Back home
          </Link>
          <h1 className={`mt-8 text-center ${marketingPageTitle}`}>
            Which Dublin house are you?
          </h1>
          <div className="mt-12">
            {authReady ? (
              <HouseQuiz nextStep={nextStep} embedded />
            ) : (
              <p className="text-base text-slate-500">Loading quiz…</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
