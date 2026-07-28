"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, MapPin, RotateCcw } from "lucide-react";
import {
  HOUSE_QUIZ_QUESTIONS,
  HOUSE_RESULTS,
  computeScores,
  getTopArchetype,
  type HouseArchetype,
} from "@/lib/house-quiz";
import type { QuizNextStep } from "@/lib/quiz-next-step";
import { SITE_GUTTER } from "@/lib/page-layout";
import {
  homeBody,
  homeDisplayTitle,
  heroTitle,
  quizProgressMeta,
  homeEyebrow,
  homePrimaryButton,
  homeTextLink,
} from "@/lib/homepage-ui";

type HouseQuizProps = {
  nextStep: QuizNextStep;
  embedded?: boolean;
};

export default function HouseQuiz({ nextStep, embedded = false }: HouseQuizProps) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [finished, setFinished] = useState(false);

  const totalQuestions = HOUSE_QUIZ_QUESTIONS.length;
  const currentQuestion = HOUSE_QUIZ_QUESTIONS[step];
  const progressPct = finished ? 100 : Math.round(((step + 1) / totalQuestions) * 100);

  const result = useMemo(() => {
    if (!finished) return null;
    const scores = computeScores(answers);
    const resultType = getTopArchetype(scores);
    return HOUSE_RESULTS[resultType];
  }, [finished, answers]);

  function handleAnswer(optionIndex: number) {
    const nextAnswers = [...answers.slice(0, step), optionIndex];
    setAnswers(nextAnswers);

    if (step >= totalQuestions - 1) {
      setFinished(true);
      return;
    }

    setStep((current) => current + 1);
  }

  function handleBack() {
    if (finished) {
      setFinished(false);
      return;
    }
    if (step > 0) {
      setAnswers((current) => current.slice(0, -1));
      setStep((current) => current - 1);
    }
  }

  function handleRestart() {
    setStep(0);
    setAnswers([]);
    setFinished(false);
  }

  const shellClass = embedded ? "" : "border-t border-slate-200/80 py-16 sm:py-20";

  return (
    <section className={shellClass}>
      <div className={embedded ? "" : `w-full ${SITE_GUTTER}`}>
        {!embedded ? (
          <div className="mb-10 max-w-2xl">
            <h2 className={homeDisplayTitle}>What&apos;s your Dublin house type?</h2>
          </div>
        ) : null}

        <div
          className={
            embedded
              ? "mx-auto w-full max-w-4xl text-left lg:max-w-5xl"
              : finished
                ? "max-w-4xl"
                : "max-w-3xl"
          }
        >
          {!finished ? (
            <div className="border-t border-slate-200/80 pt-10 sm:pt-12">
              <div className={`flex items-center justify-between gap-4 ${quizProgressMeta}`}>
                <span>
                  Question <span className="font-semibold text-slate-950">{step + 1}</span> of {totalQuestions}
                </span>
                <span className="font-semibold text-[#002FA7]">{progressPct}%</span>
              </div>
              <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-slate-200/80">
                <div
                  className="h-full rounded-full bg-[#002FA7] transition-all duration-500 ease-out"
                  style={{ width: `${progressPct}%` }}
                />
              </div>

              <h3
                className={`mt-10 ${heroTitle} ${embedded ? "text-left lg:leading-snug" : ""}`}
              >
                {currentQuestion.prompt}
              </h3>

              <ul className={`mt-10 border-t border-slate-200/80 ${embedded ? "text-left" : ""}`}>
                {currentQuestion.options.map((option, index) => (
                  <li key={option.label} className="border-b border-slate-200/80">
                    <button
                      type="button"
                      onClick={() => handleAnswer(index)}
                      className={`group flex w-full items-center justify-between gap-4 text-left leading-relaxed text-slate-950 transition hover:text-[#002FA7] ${
                        embedded
                          ? "py-5 text-lg sm:py-6 sm:text-xl sm:leading-relaxed"
                          : "py-4 text-base sm:py-5"
                      }`}
                    >
                      <span>{option.label}</span>
                      <ArrowRight
                        className={`shrink-0 text-slate-300 transition group-hover:text-[#002FA7] ${
                          embedded ? "h-5 w-5" : "h-4 w-4"
                        }`}
                        aria-hidden
                      />
                    </button>
                  </li>
                ))}
              </ul>

              {step > 0 ? (
                <button
                  type="button"
                  onClick={handleBack}
                  className={`mt-10 inline-flex items-center gap-2 ${homeTextLink} ${embedded ? "text-base" : ""}`}
                >
                  <ArrowLeft className={embedded ? "h-5 w-5" : "h-4 w-4"} />
                  Back
                </button>
              ) : null}
            </div>
          ) : result ? (
            <QuizResult result={result} nextStep={nextStep} onRestart={handleRestart} embedded={embedded} />
          ) : null}
        </div>
      </div>
    </section>
  );
}

function QuizResult({
  result,
  nextStep,
  onRestart,
  embedded = false,
}: {
  result: (typeof HOUSE_RESULTS)[HouseArchetype];
  nextStep: QuizNextStep;
  onRestart: () => void;
  embedded?: boolean;
}) {
  return (
    <div className={`space-y-12 border-t border-slate-200/80 pt-10 sm:pt-12 ${embedded ? "text-left" : ""}`}>
      <div className="relative overflow-hidden rounded-2xl">
        <img
          src={result.image}
          alt={result.imageAlt}
          className="aspect-[16/10] w-full object-cover sm:aspect-[21/9]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/25 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-10">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-white sm:text-base">
            Your match
          </p>
          <h3
            className="mt-3 inline-block max-w-full bg-[#002FA7] px-3 py-2 font-sans text-xl font-semibold uppercase tracking-[0.32em] text-white sm:px-4 sm:py-2.5 sm:text-2xl lg:text-3xl"
          >
            {result.title}
          </h3>
          <p className="mt-3 text-lg text-white sm:text-xl">{result.subtitle}</p>
        </div>
      </div>

      <div className="grid gap-10 lg:grid-cols-12 lg:gap-12">
        <div className="lg:col-span-7 space-y-5">
          <p className={`${homeBody} text-slate-950`}>{result.personality}</p>
          <p className={homeBody}>{result.houseDescription}</p>
        </div>

        <div className="lg:col-span-5 border-t border-slate-200/80 pt-8 lg:border-l lg:border-t-0 lg:pl-10 lg:pt-0">
          <h4 className="font-sans text-lg font-bold text-slate-950">Where to find this kind of home</h4>
          <p className={`mt-3 ${homeBody}`}>{result.directoryHint}</p>

          <ul className="mt-6 space-y-3">
            {result.areas.map((area) => (
              <li key={area} className="flex items-start gap-2.5 text-base text-slate-950">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#002FA7]" aria-hidden />
                <span>{area}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-slate-200/80 pt-10 sm:pt-12">
        <p className={homeEyebrow}>{nextStep.eyebrow}</p>
        <p
          className={`mt-2 font-sans font-bold text-slate-950 ${
            embedded ? "text-xl sm:text-2xl" : "text-lg"
          }`}
        >
          {nextStep.headline}
        </p>
        <p
          className="mt-4 text-lg leading-relaxed text-slate-600 sm:text-xl sm:leading-[1.65]"
        >
          {nextStep.body}
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <Link href={nextStep.primaryHref} className={`inline-flex items-center gap-2 ${homePrimaryButton}`}>
            {nextStep.primaryLabel}
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
          {nextStep.secondaryHref && nextStep.secondaryLabel ? (
            <Link
              href={nextStep.secondaryHref}
              className={`inline-flex items-center justify-center gap-2 px-2 py-3 ${homeTextLink}`}
            >
              {nextStep.secondaryLabel}
            </Link>
          ) : null}
          <button
            type="button"
            onClick={onRestart}
            className={`inline-flex items-center gap-2 px-2 py-3 ${homeTextLink}`}
          >
            <RotateCcw className="h-4 w-4" />
            Take it again
          </button>
        </div>
      </div>
    </div>
  );
}
