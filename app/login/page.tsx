"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { pingActivity } from "@/lib/activity-client";
import { parseAppRole } from "@/lib/profile-role";
import { Loader2 } from "lucide-react";
import LoginDoorCollage from "@/components/login-door-collage";

type UserRole = "Guest" | "Host";
type AuthMode = "signin" | "signup";

const ROLE_OPTIONS: { value: UserRole; label: string; blurb: string }[] = [
  { value: "Guest", label: "Guest (Traveler)", blurb: "I want to visit homes and hear stories." },
  { value: "Host", label: "Host (Local Guide)", blurb: "I want to open my home and share mine." },
];

function LoginInner() {
  const router = useRouter();
  const params = useSearchParams();
  const supabase = createClient();

  const [mode, setMode] = useState<AuthMode>("signin");
  const [role, setRole] = useState<UserRole>("Guest");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  useEffect(() => {
    const initialMode = params.get("mode");
    if (initialMode === "signup") {
      setMode("signup");
    } else {
      setMode("signin");
    }
  }, [params]);

  useEffect(() => {
    const footer = document.querySelector("footer");
    if (footer) {
      footer.style.display = "none";
    }
    return () => {
      if (footer) {
        footer.style.display = "";
      }
    };
  }, []);

  function switchMode(next: AuthMode) {
    setMode(next);
    setError(null);
    setInfo(null);
    if (next === "signin") {
      setAgeConfirmed(false);
      setTermsAccepted(false);
    }
  }

  async function syncProfileRole(userId: string, preferredRole?: UserRole) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .maybeSingle();

    if (parseAppRole(profile?.role)) return;

    const {
      data: { user },
    } = await supabase.auth.getUser();
    const metaRole = parseAppRole(user?.user_metadata?.role);
    const roleToSet = preferredRole ?? metaRole;
    if (!roleToSet) return;

    await supabase.from("profiles").update({ role: roleToSet }).eq("id", userId);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setSubmitting(true);
    try {
      if (mode === "signup") {
        if (!ageConfirmed) {
          setError("You must confirm you are at least 18 years old.");
          return;
        }
        if (!termsAccepted) {
          setError("Please accept the Terms & Safety policy to continue.");
          return;
        }
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { role },
            emailRedirectTo: `${window.location.origin}/profile`,
          },
        });
        if (error || !data.user) {
          setError(error?.message ?? "Unable to create your account.");
          return;
        }
        if (!data.session) {
          setInfo("Account created — check your inbox to confirm your email, then sign in.");
          return;
        }
        await syncProfileRole(data.user.id, role);
        pingActivity();
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          setError(error.message);
          return;
        }
        if (data.user) await syncProfileRole(data.user.id);
        pingActivity();
      }
      router.push("/profile");
      router.refresh();
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleGoogle() {
    setError(null);
    if (mode === "signup") window.localStorage.setItem("walkin_pending_role", role);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/profile` },
    });
    if (error) setError(error.message);
  }

  const inputClass =
    "mt-1.5 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm text-slate-950 focus:border-[#002FA7] focus:outline-none focus:ring-1 focus:ring-[#002FA7] transition-all duration-300 shadow-[0_4px_15px_rgba(0,47,167,0.01)] font-light placeholder:text-slate-400";

  return (
    <div className="grid min-h-[calc(100vh-4rem)] w-full lg:grid-cols-2 lg:items-stretch bg-white overflow-hidden">
      <LoginDoorCollage />

      <div className="relative flex h-full min-h-[calc(100vh-4rem)] items-center justify-center overflow-y-auto z-10">
        <div className="pointer-events-none absolute inset-0 z-0 opacity-30 bg-[radial-gradient(#002fa709_1.5px,transparent_1.5px)] [background-size:32px_32px]" />
        <div className="relative z-10 w-full max-w-sm px-6 py-12">
          <div className="text-center space-y-2">
            <h1 className="font-serif text-3xl font-normal tracking-tight text-slate-950">
              {mode === "signin" ? "Welcome back" : "Create your account"}
            </h1>
            <p className="mt-2 text-sm text-slate-500 font-light">
              {mode === "signin" ? "Sign in to continue your Dublin story." : "Just the basics — you'll customize your profile next."}
            </p>
          </div>

          <div className="mt-8 grid grid-cols-2 rounded-full bg-slate-100 p-1 text-sm font-medium border border-slate-150">
            <button
              type="button"
              onClick={() => switchMode("signin")}
              className={`rounded-full py-2.5 transition-all duration-300 ${mode === "signin" ? "bg-white text-[#002FA7] shadow-sm font-semibold" : "text-slate-500 hover:text-slate-950"}`}
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => switchMode("signup")}
              className={`rounded-full py-2.5 transition-all duration-300 ${mode === "signup" ? "bg-white text-[#002FA7] shadow-sm font-semibold" : "text-slate-500 hover:text-slate-950"}`}
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            {mode === "signup" && (
              <fieldset className="space-y-3">
                <legend className="mb-1 block text-xs font-mono uppercase tracking-wider text-slate-600">
                  I&apos;m joining as a…
                </legend>
                <div className="grid grid-cols-2 gap-3">
                  {ROLE_OPTIONS.map((option) => {
                    const selected = role === option.value;
                    return (
                      <label
                        key={option.value}
                        className={`cursor-pointer rounded-2xl border p-4 text-sm transition-all duration-300 shadow-sm ${
                          selected
                            ? "border-[#002FA7] bg-[#002fa7]/5 ring-1 ring-[#002FA7]"
                            : "border-slate-200 bg-white hover:border-slate-350"
                        }`}
                      >
                        <input
                          type="radio"
                          name="role"
                          value={option.value}
                          checked={selected}
                          onChange={() => setRole(option.value)}
                          className="sr-only"
                        />
                        <span className="block font-serif font-medium text-slate-950">{option.label}</span>
                        <span className="mt-1 block text-xs text-slate-500 font-light leading-relaxed">{option.blurb}</span>
                      </label>
                    );
                  })}
                </div>
              </fieldset>
            )}

            <div>
              <label htmlFor="email" className="block text-xs font-mono tracking-wider uppercase text-slate-600">Email</label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClass}
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-mono tracking-wider uppercase text-slate-600">Password</label>
              <input
                id="password"
                type="password"
                required
                minLength={6}
                autoComplete={mode === "signin" ? "current-password" : "new-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputClass}
                placeholder="••••••••"
              />
            </div>

            {mode === "signup" && (
              <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50/50 p-4">
                <label className="flex items-start gap-3 text-sm font-light text-slate-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={ageConfirmed}
                    onChange={(e) => setAgeConfirmed(e.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-slate-300 text-[#002FA7] focus:ring-[#002FA7]"
                  />
                  <span>I confirm I am at least 18 years old.</span>
                </label>
                <label className="flex items-start gap-3 text-sm font-light text-slate-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={termsAccepted}
                    onChange={(e) => setTermsAccepted(e.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-slate-300 text-[#002FA7] focus:ring-[#002FA7]"
                  />
                  <span>
                    I agree to the{" "}
                    <a href="/terms" target="_blank" rel="noopener noreferrer" className="text-[#002FA7] font-medium hover:underline">
                      Terms, Trust &amp; Safety
                    </a>{" "}
                    policy, including the community code of conduct and refund guidelines.
                  </span>
                </label>
              </div>
            )}

            {error && <p className="text-sm text-red-600 font-light" role="alert">{error}</p>}
            {info && (
              <p className="rounded-2xl bg-[#002fa7]/5 border border-[#002fa7]/10 px-4 py-3.5 text-sm text-[#002FA7] leading-relaxed font-light" role="status">
                {info}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-[#002FA7] px-6 py-4 text-xs font-semibold uppercase tracking-widest text-white transition-all duration-300 hover:bg-[#001e6c] hover:scale-[1.01] shadow-[0_4px_15px_rgba(0,47,167,0.18)] disabled:cursor-not-allowed disabled:opacity-50 font-mono"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin text-white" />}
              {mode === "signin" ? "Login" : "Sign Up"}
            </button>
          </form>

          <div className="my-6 flex items-center gap-3 text-xs text-slate-350">
            <span className="h-px flex-1 bg-slate-150" />
            <span className="uppercase tracking-widest font-mono text-slate-400 text-[10px]">or</span>
            <span className="h-px flex-1 bg-slate-150" />
          </div>

          <button
            type="button"
            onClick={handleGoogle}
            disabled={submitting}
            className="flex w-full items-center justify-center gap-3 rounded-full border border-slate-200 bg-white px-6 py-3.5 text-sm font-medium text-slate-700 shadow-[0_4px_15px_rgba(0,0,0,0.015)] transition-all duration-300 hover:bg-slate-50 hover:border-slate-300 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <GoogleIcon />
            <span className="tracking-wide">Continue with Google</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-[60vh] items-center justify-center bg-white">
        <Loader2 className="h-6 w-6 animate-spin text-[#002FA7]" />
      </div>
    }>
      <LoginInner />
    </Suspense>
  );
}

function GoogleIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden focusable="false">
      <path fill="#4285F4" d="M23.52 12.27c0-.79-.07-1.54-.2-2.27H12v4.51h6.47a5.54 5.54 0 0 1-2.4 3.63v3h3.88c2.27-2.09 3.57-5.17 3.57-8.87z" />
      <path fill="#34A853" d="M12 24c3.24 0 5.96-1.08 7.95-2.91l-3.88-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09A12 12 0 0 0 12 24z" />
      <path fill="#FBBC05" d="M5.27 14.29a7.2 7.2 0 0 1 0-4.58V6.62H1.29a12 12 0 0 0 0 10.76l3.98-3.09z" />
      <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.44-3.44A11.97 11.97 0 0 0 12 0 12 12 0 0 0 1.29 6.62l3.98 3.09C6.22 6.86 8.87 4.75 12 4.75z" />
    </svg>
  );
}