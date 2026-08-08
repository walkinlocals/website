"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { PAGE_CONTAINER, PAGE_SHELL } from "@/lib/page-layout";
import { heroTitle, homeTextLink } from "@/lib/homepage-ui";

const inputClass =
  "mt-2 w-full rounded-2xl border border-slate-200 bg-white px-5 py-4 text-base font-light text-slate-950 shadow-sm transition focus:border-[#002FA7] focus:outline-none focus:ring-1 focus:ring-[#002FA7]";

const labelClass =
  "block text-sm font-mono uppercase tracking-wider text-slate-600 sm:text-[0.975rem]";

export default function ResetPasswordPage() {
  const router = useRouter();
  const supabase = createClient();
  const [checkingSession, setCheckingSession] = useState(true);
  const [hasSession, setHasSession] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    let active = true;

    async function checkSession() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!active) return;
      setHasSession(Boolean(user));
      setCheckingSession(false);
    }

    void checkSession();
    return () => {
      active = false;
    };
  }, [supabase]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError("Your password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Those passwords don't match.");
      return;
    }

    setSubmitting(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) {
        setError(updateError.message);
        return;
      }
      setDone(true);
      setTimeout(() => router.push("/profile"), 1800);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className={`${PAGE_SHELL} font-sans text-slate-950`}>
      <div className={`${PAGE_CONTAINER} py-14 sm:py-20 lg:py-24`}>
        <div className="mx-auto w-full max-w-md">
          <h1 className={`${heroTitle} !text-[1.625rem] sm:!text-[2.1rem]`}>Choose a new password</h1>

          {checkingSession ? (
            <p className="mt-6 flex items-center gap-2 text-base font-light text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              Checking your reset link…
            </p>
          ) : !hasSession ? (
            <>
              <p className="mt-4 text-base font-light leading-relaxed text-slate-600">
                This reset link is invalid or has expired. Request a new one from the sign in page.
              </p>
              <Link href="/login" className={`mt-8 inline-block ${homeTextLink}`}>
                Back to sign in →
              </Link>
            </>
          ) : done ? (
            <p
              className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50/60 px-5 py-4 text-base font-light leading-relaxed text-emerald-900"
              role="status"
            >
              Password updated. Taking you to your profile…
            </p>
          ) : (
            <form onSubmit={handleSubmit} className="mt-8 space-y-6">
              <div>
                <label htmlFor="new-password" className={labelClass}>
                  New password
                </label>
                <input
                  id="new-password"
                  type="password"
                  required
                  minLength={6}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={inputClass}
                  placeholder="••••••••"
                />
              </div>

              <div>
                <label htmlFor="confirm-password" className={labelClass}>
                  Confirm new password
                </label>
                <input
                  id="confirm-password"
                  type="password"
                  required
                  minLength={6}
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={inputClass}
                  placeholder="••••••••"
                />
              </div>

              {error && (
                <p className="text-base font-light text-red-600" role="alert">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-[#002FA7] px-7 py-5 font-mono text-sm font-semibold uppercase tracking-widest text-white shadow-[0_4px_15px_rgba(0,47,167,0.18)] transition-all duration-300 hover:bg-[#001e6c] disabled:cursor-not-allowed disabled:opacity-50 sm:text-[0.975rem]"
              >
                {submitting && <Loader2 className="h-5 w-5 animate-spin text-white" />}
                Update password
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
