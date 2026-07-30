export type QuizNextStep = {
  eyebrow: string;
  headline: string;
  body: string;
  primaryHref: string;
  primaryLabel: string;
  secondaryHref?: string;
  secondaryLabel?: string;
};

/** Pre-launch waitlist site has no accounts yet — every result points back to the waitlist. */
export const QUIZ_NEXT_STEP: QuizNextStep = {
  eyebrow: "Next step",
  headline: "Be first through the door",
  body: "Join the waitlist now and we'll let you know the moment we launch in Dublin.",
  primaryHref: "#waitlist",
  primaryLabel: "Join the waitlist",
};
