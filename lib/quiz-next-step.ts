import type { AppRole } from "@/lib/profile-role";

export type QuizNextStep = {
  eyebrow: string;
  headline: string;
  body: string;
  primaryHref: string;
  primaryLabel: string;
  secondaryHref?: string;
  secondaryLabel?: string;
};

export function quizNextStepForAudience(
  isAuthed: boolean,
  role: AppRole | null | undefined,
): QuizNextStep {
  if (!isAuthed) {
    return {
      eyebrow: "Next step",
      headline: "Meet a host who fits your style",
      body: "Join the waitlist as a guest. When we launch, browse real homes in Dublin and ask for a visit.",
      primaryHref: "/#waitlist",
      primaryLabel: "Join the guest waitlist",
    };
  }

  if (role === "Host") {
    return {
      eyebrow: "Next step",
      headline: "Hope that was fun: you're already part of the story",
      body: "Hosts can welcome any guest. Save these areas for ideas, or see who is visiting Dublin.",
      primaryHref: "/guest-directory",
      primaryLabel: "Browse guests",
    };
  }

  return {
    eyebrow: "Next step",
    headline: "Meet a host who fits your style",
    body: "Browse real homes, read host stories, and ask for a visit in the areas above.",
    primaryHref: "/host-directory",
    primaryLabel: "Browse Dublin hosts",
  };
}
