"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, RotateCcw } from "lucide-react";
import {
  HOUSE_QUIZ_QUESTIONS,
  HOUSE_RESULTS,
  computeScores,
  getTopArchetype,
  type HouseArchetype,
} from "@/lib/house-quiz";

type HouseQuizProps = {
  hostsDirectoryHref: string;
  embedded?: boolean;
};

export default function HouseQuiz({ hostsDirectoryHref, embedded = false }: HouseQuizProps) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [finished, setFinished] = useState(false);

  const totalQuestions = HOUSE_QUIZ_QUESTIONS.length;
  const currentQuestion = HOUSE_QUIZ_QUESTIONS[step];
  const scores = useMemo(() => computeScores(answers), [answers]);
  const resultType = useMemo(() => getTopArchetype(scores), [scores]);
  const result = HOUSE_RESULTS[resultType];

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

  return (
    <section
      className={`relative z-10 border-t border-[#002fa7]/10 bg-white ${embedded ? "py-12 sm:py-16" : "py-20 sm:py-28"}`}
    >
      <div className="mx-auto max-w-6xl px-6">
        {!embedded ? (
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <h2 className="font-serif text-3xl font-normal text-slate-950 sm:text-4xl">
              What&apos;s your Dublin house type?
            </h2>
            <p className="mt-4 font-sans text-sm font-light leading-relaxed text-slate-500 sm:text-base">
              Dublin&apos;s homes aren&apos;t scattered at random — each neighbourhood has its own architectural
              story. Answer {totalQuestions} quick questions and we&apos;ll match you to the Dublin home — and
              hosts — that fit you best.
            </p>
          </div>
        ) : null}

        <div className="mx-auto max-w-3xl rounded-3xl border border-[#002fa7]/15 bg-white p-6 shadow-[0_10px_40px_rgba(0,47,167,0.04)] sm:p-10">
          {!finished ? (
            <>
              <div className="mb-8 flex items-center justify-between gap-4">
                <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#002FA7]/70">
                  Question {step + 1} of {totalQuestions}
                </span>
                <div className="flex gap-1.5">
                  {HOUSE_QUIZ_QUESTIONS.map((question, index) => (
                    <span
                      key={question.id}
                      className={`h-1.5 w-6 rounded-full transition-colors ${
                        index <= step ? "bg-[#002FA7]" : "bg-slate-200"
                      }`}
                    />
                  ))}
                </div>
              </div>

              <h3 className="font-serif text-2xl font-normal leading-snug text-slate-950 sm:text-3xl">
                {currentQuestion.prompt}
              </h3>

              <div className="mt-8 space-y-3">
                {currentQuestion.options.map((option, index) => (
                  <button
                    key={option.label}
                    type="button"
                    onClick={() => handleAnswer(index)}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-5 py-4 text-left font-sans text-sm font-light leading-relaxed text-slate-700 transition hover:border-[#002FA7]/30 hover:bg-[#002FA7]/[0.03] hover:text-[#002FA7]"
                  >
                    {option.label}
                  </button>
                ))}
              </div>

              {step > 0 ? (
                <button
                  type="button"
                  onClick={handleBack}
                  className="mt-8 inline-flex items-center gap-2 font-sans text-sm text-slate-500 transition hover:text-[#002FA7]"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Previous question
                </button>
              ) : null}
            </>
          ) : (
            <QuizResult
              result={result}
              hostsDirectoryHref={hostsDirectoryHref}
              onRestart={handleRestart}
            />
          )}
        </div>
      </div>
    </section>
  );
}

function QuizResult({
  result,
  hostsDirectoryHref,
  onRestart,
}: {
  result: (typeof HOUSE_RESULTS)[HouseArchetype];
  hostsDirectoryHref: string;
  onRestart: () => void;
}) {
  return (
    <div className="space-y-8">
      <div className="text-center">
        <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-[#002FA7]/70">
          Your Dublin match
        </p>
        <h3 className="mt-3 font-serif text-3xl font-normal text-slate-950 sm:text-4xl">{result.title}</h3>
        <p className="mt-2 font-serif text-lg italic text-[#002FA7]">{result.subtitle}</p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-[#002fa7]/10">
        <img src={result.image} alt={result.imageAlt} className="aspect-[4/3] w-full object-cover" />
        {result.imageCredit ? (
          <p className="bg-slate-50 px-4 py-2 text-center font-sans text-[10px] text-slate-400">
            Photo: {result.imageCredit}
          </p>
        ) : null}
      </div>

      <div className="space-y-4 font-sans text-sm font-light leading-relaxed text-slate-600">
        <p>{result.personality}</p>
        <p>{result.houseDescription}</p>
      </div>

      <div className="rounded-2xl border border-[#002fa7]/15 bg-[#002fa7]/[0.03] p-6">
        <h4 className="font-serif text-xl text-slate-950">Find this kind of home in…</h4>
        <p className="mt-2 font-sans text-sm font-light leading-relaxed text-slate-600">
          {result.directoryHint}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {result.areas.map((area) => (
            <span
              key={area}
              className="rounded-full border border-[#002fa7]/15 bg-white px-3 py-1.5 font-sans text-xs text-[#002FA7]"
            >
              {area}
            </span>
          ))}
        </div>
      </div>

      <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-center">
        <Link
          href={hostsDirectoryHref}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-[#002FA7] px-8 py-3.5 text-sm font-medium text-white transition hover:bg-[#001e6c]"
        >
          Browse Dublin hosts
          <ArrowRight className="h-4 w-4" />
        </Link>
        <button
          type="button"
          onClick={onRestart}
          className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 px-8 py-3.5 text-sm font-medium text-slate-600 transition hover:border-[#002FA7]/20 hover:text-[#002FA7]"
        >
          <RotateCcw className="h-4 w-4" />
          Take the quiz again
        </button>
      </div>
    </div>
  );
}
