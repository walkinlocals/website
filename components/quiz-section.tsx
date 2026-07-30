"use client";

import { useState } from "react";
import HouseQuiz from "@/components/house-quiz";
import { QUIZ_NEXT_STEP } from "@/lib/quiz-next-step";
import { CREAM } from "@/lib/brand";
import {
  homeBody,
  homeContainer,
  homeDisplayTitle,
  homePrimaryButton,
  homeSectionBorder,
  homeSectionY,
} from "@/lib/homepage-ui";

export default function QuizSection() {
  const [started, setStarted] = useState(false);

  return (
    <section className={`${homeSectionBorder} ${homeSectionY}`} style={{ backgroundColor: CREAM }}>
      <div className={homeContainer}>
        {started ? (
          <HouseQuiz nextStep={QUIZ_NEXT_STEP} embedded onExit={() => setStarted(false)} />
        ) : (
          <>
            <h2 className={homeDisplayTitle}>Which Dublin house are you?</h2>
            <p className={`mt-4 max-w-2xl ${homeBody}`}>
              Ten quick questions, let&apos;s see what matches your style.
            </p>
            <button
              type="button"
              onClick={() => setStarted(true)}
              className={`mt-8 ${homePrimaryButton}`}
            >
              Take the quiz
            </button>
          </>
        )}
      </div>
    </section>
  );
}
