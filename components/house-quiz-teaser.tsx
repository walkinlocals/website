"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { CREAM } from "@/lib/brand";
import { HOUSE_RESULTS, QUIZ_OPTION_IMAGES } from "@/lib/house-quiz";
import DoorSketchBackground from "@/components/door-sketch-background";
import HouseQuiz from "@/components/house-quiz";
import { createClient } from "@/lib/supabase/client";
import { quizNextStepForAudience, type QuizNextStep } from "@/lib/quiz-next-step";
import type { AppRole } from "@/lib/profile-role";
import {
  homeBody,
  homeContainer,
  homeDisplayTitle,
  homePrimaryButton,
  homeSectionBorder,
  homeSectionY,
} from "@/lib/homepage-ui";

const ARCHETYPE_TITLES = Object.values(HOUSE_RESULTS).map((result) => result.title);

function RotatingArchetype() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setIndex((current) => (current + 1) % ARCHETYPE_TITLES.length);
    }, 2200);
    return () => clearInterval(id);
  }, []);

  return (
    <span
      key={index}
      className="animate-archetype-fade-in inline-block font-semibold text-[#002FA7]"
    >
      {ARCHETYPE_TITLES[index]}
    </span>
  );
}

const VISITOR_NEXT_STEP = quizNextStepForAudience(false, null);

export default function HouseQuizTeaser() {
  const [started, setStarted] = useState(false);
  const [nextStep, setNextStep] = useState<QuizNextStep>(VISITOR_NEXT_STEP);

  useEffect(() => {
    let active = true;
    const supabase = createClient();

    async function resolveAudience() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!active) return;
      if (!user) return;

      const { data } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
      if (!active) return;
      setNextStep(quizNextStepForAudience(true, data?.role as AppRole | null));
    }

    void resolveAudience();
    return () => {
      active = false;
    };
  }, []);

  if (started) {
    return (
      <section
        id="quiz"
        className={`relative scroll-mt-24 overflow-hidden ${homeSectionBorder} ${homeSectionY}`}
        style={{ backgroundColor: CREAM }}
      >
        <DoorSketchBackground />
        <div className={`${homeContainer} relative`}>
          <div className="mx-auto w-full max-w-4xl lg:max-w-5xl">
            <HouseQuiz nextStep={nextStep} embedded />
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      id="quiz"
      className={`relative scroll-mt-24 overflow-hidden ${homeSectionBorder} ${homeSectionY}`}
      style={{ backgroundColor: CREAM }}
    >
      <DoorSketchBackground />
      <div className={`${homeContainer} relative flex flex-col items-center text-center`}>
        <h2 className={homeDisplayTitle}>Which Dublin house are you?</h2>
        <p className={`mt-4 max-w-2xl ${homeBody}`}>
          Ten quick questions, let&apos;s see what matches your style.
        </p>
        <p className="mt-3 text-lg text-slate-600 sm:text-xl">
          You could be… <RotatingArchetype />
        </p>

        <div className="mt-8 flex items-center justify-center">
          {QUIZ_OPTION_IMAGES.map((src, index) => (
            <div
              key={src}
              className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full sm:h-16 sm:w-16"
              style={{
                marginLeft: index === 0 ? 0 : -14,
                boxShadow: `0 0 0 3px ${CREAM}`,
                zIndex: QUIZ_OPTION_IMAGES.length - index,
              }}
            >
              <Image src={src} alt="" fill sizes="64px" className="object-cover" />
            </div>
          ))}
        </div>

        <button type="button" onClick={() => setStarted(true)} className={`mt-8 ${homePrimaryButton}`}>
          Take the quiz
        </button>
      </div>
    </section>
  );
}
