"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { buildFullName, isProfileComplete, isBrowsableProfile, isAtLeast18FromDate, maxDateOfBirthFor18Plus, normalizeDateOfBirth, profileActivationBlockers } from "@/lib/profile";
import { PAGE_MAIN, PAGE_SHELL } from "@/lib/page-layout";
import { BRAND_NAME, homePrimaryButton, marketingPageTitle, heroTitle, siteTitleSm } from "@/lib/homepage-ui";
import { formatDirectoryLocation } from "@/lib/directory-display";
import { ensureProfileRole, parseAppRole } from "@/lib/profile-role";
import { buildActivityUpdate } from "@/lib/activity";
import { INACTIVITY_DELETE_DAYS, INACTIVITY_SLEEP_DAYS } from "@/lib/inactivity";
import { DUBLIN_AREAS } from "@/lib/dublin-neighborhoods";
import { COUNTRIES } from "@/lib/countries";
import {
  Loader2,
  Camera,
  ShieldCheck,
  Lock,
  Edit2,
  ArrowLeft,
  Clock,
  Moon,
  Trash2,
  Sparkles,
  CreditCard,
} from "lucide-react";

type Role = "Guest" | "Host";

interface Form {
  role: Role | null;
  firstName: string;
  lastName: string;
  originLocation: string;
  neighborhood: string;
  phone: string;
  contactEmail: string;
  bio: string;
  dateOfBirth: string;
  avatarUrl: string | null;
  idVerified: boolean;
  ageVerified: boolean;
  payoutsEnabled: boolean;
  isActive: boolean;
  lastActivityAt: string | null;
}

const EMPTY: Form = {
  role: null,
  firstName: "",
  lastName: "",
  originLocation: "",
  neighborhood: "",
  phone: "",
  contactEmail: "",
  bio: "",
  dateOfBirth: "",
  avatarUrl: null,
  idVerified: false,
  ageVerified: false,
  payoutsEnabled: false,
  isActive: false,
  lastActivityAt: null,
};

const inputClass =
  "mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 placeholder:text-slate-400 focus:border-[#002FA7] focus:outline-none focus:ring-1 focus:ring-[#002FA7]";

const fieldLabel = "text-base font-medium text-slate-700 sm:text-lg";

const MAX_AVATAR_BYTES = 5 * 1024 * 1024;

export default function ProfilePage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-[60vh] items-center justify-center bg-white">
          <Loader2 className="h-5 w-5 animate-spin text-[#002FA7]" />
        </main>
      }
    >
      <ProfileInner />
    </Suspense>
  );
}

function ProfileInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [connectingStripe, setConnectingStripe] = useState(false);
  const [requestingManualReview, setRequestingManualReview] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [form, setForm] = useState<Form>(EMPTY);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isAsleep, setIsAsleep] = useState(false);
  const [verificationPolling, setVerificationPolling] = useState(false);

  const verificationComplete = searchParams.get("verification") === "complete";
  const connectComplete =
    searchParams.get("connect") === "complete" || searchParams.get("connect") === "refresh";

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          router.push("/login");
          return;
        }

        const { data: initialData, error: fetchError } = await supabase
          .from("profiles")
          .select(
            "role, first_name, last_name, full_name, origin_location, neighborhood, phone, contact_email, bio, avatar_url, id_verified, age_verified, date_of_birth, payouts_enabled, is_active, last_activity_at",
          )
          .eq("id", user.id)
          .single();

        if (fetchError && fetchError.code !== "PGRST116") throw fetchError;

        let sleepTriggered = false;
        const nowString = new Date().toISOString();

        if (initialData?.last_activity_at) {
          const diffDays = Math.floor(
            (Date.now() - new Date(initialData.last_activity_at).getTime()) / (1000 * 60 * 60 * 24),
          );

          if (diffDays >= INACTIVITY_DELETE_DAYS) {
            await supabase.rpc("delete_self_user");
            await supabase.auth.signOut();
            router.push("/login?message=deleted_due_to_inactivity");
            return;
          }

          if (diffDays >= INACTIVITY_SLEEP_DAYS && initialData.is_active) {
            sleepTriggered = true;
            await supabase.from("profiles").update({ is_active: false }).eq("id", user.id);
            initialData.is_active = false;
          }
        }

        await supabase.from("profiles").update({ last_activity_at: nowString, inactivity_warning_sent_at: null }).eq("id", user.id);

        let role: Role | null =
          initialData?.role === "Guest" || initialData?.role === "Host" ? initialData.role : null;

        const pending = window.localStorage.getItem("walkin_pending_role");
        role =
          (await ensureProfileRole(supabase, user.id, {
            profileRole: role,
            metadataRole: user.user_metadata?.role,
            pendingRole: pending,
          })) ?? role;
        window.localStorage.removeItem("walkin_pending_role");

        let idVerified = initialData?.id_verified ?? false;
        try {
          const syncRes = await fetch("/api/verify/sync-status", { method: "POST" });
          const syncData = (await syncRes.json().catch(() => ({}))) as { id_verified?: boolean };
          if (syncRes.ok && syncData.id_verified) idVerified = true;
        } catch {
          // Fall back to the profile row loaded above.
        }

        if (!active) return;

        const firstName = initialData?.first_name ?? "";
        const lastName = initialData?.last_name ?? "";
        const fullName = initialData?.full_name ?? "";
        const nameParts = fullName.split(" ");
        const resolvedFirst = firstName || nameParts[0] || "";
        const resolvedLast = lastName || nameParts.slice(1).join(" ") || "";
        const normalizedDob = normalizeDateOfBirth(initialData?.date_of_birth ?? "") ?? "";

        const loadedSnapshot = {
          role,
          first_name: resolvedFirst.trim() || null,
          last_name: resolvedLast.trim() || null,
          full_name: fullName || buildFullName(resolvedFirst, resolvedLast),
          bio: (initialData?.bio ?? "").trim() || null,
          avatar_url: initialData?.avatar_url ?? null,
          neighborhood: (initialData?.neighborhood ?? "").trim() || null,
          origin_location: (initialData?.origin_location ?? "").trim() || null,
          id_verified: idVerified,
          age_verified:
            initialData?.age_verified ?? isAtLeast18FromDate(normalizedDob),
          date_of_birth: normalizedDob || null,
          payouts_enabled: initialData?.payouts_enabled ?? false,
        };

        let isActive = initialData?.is_active ?? false;
        const shouldBeActive =
          isProfileComplete(loadedSnapshot) || isBrowsableProfile(loadedSnapshot);

        if (sleepTriggered) setIsAsleep(true);

        if (shouldBeActive && !sleepTriggered && !isActive) {
          const activationUpdate: { is_active: boolean; age_verified?: boolean; id_verified?: boolean } = {
            is_active: true,
          };
          if (!initialData?.age_verified && isAtLeast18FromDate(normalizedDob)) {
            activationUpdate.age_verified = true;
          }
          if (!initialData?.id_verified && idVerified) {
            activationUpdate.id_verified = true;
          }
          await supabase.from("profiles").update(activationUpdate).eq("id", user.id);
          isActive = true;
        }

        if (!shouldBeActive || sleepTriggered) {
          setIsEditing(true);
        } else {
          setIsEditing(false);
        }

        setForm({
          role,
          firstName: resolvedFirst,
          lastName: resolvedLast,
          originLocation: initialData?.origin_location ?? "",
          neighborhood: initialData?.neighborhood ?? "",
          phone: initialData?.phone ?? "",
          contactEmail: initialData?.contact_email ?? user.email ?? "",
          bio: initialData?.bio ?? "",
          dateOfBirth: normalizedDob,
          avatarUrl: initialData?.avatar_url ?? null,
          idVerified,
          ageVerified: loadedSnapshot.age_verified ?? false,
          payoutsEnabled: initialData?.payouts_enabled ?? false,
          isActive,
          lastActivityAt: nowString,
        });
      } catch (err) {
        console.error("Error loading profile:", err);
        setError("Unable to load profile.");
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    return () => {
      active = false;
    };
  }, [router, supabase]);

  useEffect(() => {
    if (loading) return;

    let cancelled = false;

    async function syncVerificationStatus() {
      try {
        const res = await fetch("/api/verify/sync-status", { method: "POST" });
        const data = (await res.json().catch(() => ({}))) as {
          id_verified?: boolean;
          is_active?: boolean;
        };
        if (cancelled || !res.ok) return;

        setForm((prev) => {
          const next = { ...prev, idVerified: data.id_verified ?? prev.idVerified };
          const active = isProfileComplete(profileSnapshot(next), {
            hasPendingAvatar: Boolean(avatarFile),
          });
          if (active) {
            setIsEditing(false);
            setIsAsleep(false);
          }
          return { ...next, isActive: active || prev.isActive };
        });

        if (data.is_active) {
          setIsEditing(false);
        }
      } catch {
        // Non-blocking background sync.
      }
    }

    syncVerificationStatus();

    return () => {
      cancelled = true;
    };
  }, [loading, avatarFile]);

  useEffect(() => {
    if (!verificationComplete && !connectComplete) return;

    let cancelled = false;

    async function syncFromStripe() {
      if (verificationComplete) setVerificationPolling(true);

      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;

        if (verificationComplete) {
          let idVerified = false;
          let hostRole = false;

          try {
            const res = await fetch("/api/verify/sync-status", { method: "POST" });
            const data = (await res.json().catch(() => ({}))) as { id_verified?: boolean };
            if (res.ok && data.id_verified) idVerified = true;
          } catch {
            // sync-status can fail locally; fall back to profile + webhook state.
          }

          const { data: profile } = await supabase
            .from("profiles")
            .select("id_verified, role")
            .eq("id", user.id)
            .single();

          if (!idVerified) {
            idVerified = profile?.id_verified ?? false;
          }
          hostRole = profile?.role === "Host";

          if (!cancelled) {
            if (idVerified) {
              setForm((prev) => {
                const next = { ...prev, idVerified: true };
                const active = isProfileComplete(profileSnapshot(next), {
                  hasPendingAvatar: Boolean(avatarFile),
                });
                if (active) {
                  setIsEditing(false);
                  setIsAsleep(false);
                }
                return { ...next, isActive: active || next.isActive };
              });
              setSuccess(
                hostRole
                  ? "Identity verified. Finish payout setup below to activate your host profile."
                  : "Identity verified. Save your profile to activate when ready.",
              );
            } else {
              setSuccess(
                "Stripe finished processing. If verification does not appear, wait a moment and refresh.",
              );
            }
            router.replace("/profile");
          }
        } else {
          let payoutsEnabled = false;
          let isActive = false;
          let idVerified = false;

          try {
            const syncRes = await fetch("/api/stripe/connect/sync-status", { method: "POST" });
            const syncData = (await syncRes.json().catch(() => ({}))) as {
              payouts_enabled?: boolean;
              is_active?: boolean;
              id_verified?: boolean;
            };
            if (syncRes.ok) {
              payoutsEnabled = syncData.payouts_enabled ?? false;
              isActive = syncData.is_active ?? false;
              idVerified = syncData.id_verified ?? false;
            }
          } catch {
            // Fall back to profile row if sync fails.
          }

          const { data } = await supabase
            .from("profiles")
            .select("payouts_enabled, is_active, id_verified")
            .eq("id", user.id)
            .single();

          if (data && !cancelled) {
            payoutsEnabled = payoutsEnabled || data.payouts_enabled;
            isActive = isActive || data.is_active;
            idVerified = idVerified || data.id_verified;

            setForm((prev) => {
              const next = {
                ...prev,
                payoutsEnabled,
                idVerified: idVerified || prev.idVerified,
              };
              const active = isProfileComplete(profileSnapshot(next), {
                hasPendingAvatar: Boolean(avatarFile),
              });
              return {
                ...next,
                isActive: isActive || active,
              };
            });
            if (isActive) setIsAsleep(false);
            setSuccess(
              payoutsEnabled
                ? "Payout account connected. Your host profile can now activate."
                : "Stripe onboarding saved. Click Set Up Payouts again if any steps are still missing.",
            );
            router.replace("/profile");
          }
        }
      } finally {
        if (!cancelled) setVerificationPolling(false);
      }
    }

    syncFromStripe();

    return () => {
      cancelled = true;
    };
  }, [verificationComplete, connectComplete, router, supabase, avatarFile]);

  function profileMissingReasons(f: Form): string[] {
    return profileActivationBlockers(profileSnapshot(f), { hasPendingAvatar: Boolean(avatarFile) });
  }

  function profileSnapshot(f: Form) {
    const normalizedDob = normalizeDateOfBirth(f.dateOfBirth) ?? "";
    const ageVerified = isAtLeast18FromDate(normalizedDob);
    return {
      role: f.role,
      first_name: f.firstName.trim() || null,
      last_name: f.lastName.trim() || null,
      full_name: buildFullName(f.firstName, f.lastName),
      bio: f.bio.trim() || null,
      avatar_url: f.avatarUrl,
      neighborhood: f.neighborhood.trim() || null,
      origin_location: f.originLocation.trim() || null,
      id_verified: f.idVerified,
      age_verified: ageVerified,
      date_of_birth: normalizedDob || null,
      payouts_enabled: f.payoutsEnabled,
    };
  }

  function complete(f: Form): boolean {
    return isProfileComplete(profileSnapshot(f), { hasPendingAvatar: Boolean(avatarFile) });
  }

  async function handleWakeUp() {
    setSaving(true);
    setError(null);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const nowString = new Date().toISOString();
      const activityUpdate = buildActivityUpdate({
        ...profileSnapshot(form),
        is_active: form.isActive,
      });

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ ...activityUpdate, is_active: complete(form), inactivity_warning_sent_at: null })
        .eq("id", user.id);

      if (updateError) throw updateError;

      setForm((prev) => ({
        ...prev,
        isActive: complete(prev),
        lastActivityAt: nowString,
      }));
      setIsAsleep(false);
      setSuccess("Welcome back! Your profile has been restored to the directories.");
    } catch {
      setError("Could not restore your profile.");
    } finally {
      setSaving(false);
    }
  }

  function onPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    if (!file) return;

    if (file.size > MAX_AVATAR_BYTES) {
      setError("Image must be smaller than 5MB.");
      e.target.value = "";
      return;
    }

    setError(null);
    setAvatarFile(file);
    if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    setAvatarPreview(URL.createObjectURL(file));
  }

  async function uploadAvatar(userId: string, file: File): Promise<string> {
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `${userId}/avatar.${ext}`;
    const { error } = await supabase.storage
      .from("avatars")
      .upload(path, file, {
        upsert: true,
        contentType: file.type || "application/octet-stream",
      });
    if (error) throw error;
    return supabase.storage.from("avatars").getPublicUrl(path).data.publicUrl;
  }

  async function requestManualReview() {
    setRequestingManualReview(true);
    setError(null);
    try {
      const res = await fetch("/api/verify/manual-review", { method: "POST" });
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(body.error ?? "Could not request manual review.");
        return;
      }
      setSuccess("Manual review requested. Our team will respond within 2 business days.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error");
    } finally {
      setRequestingManualReview(false);
    }
  }

  async function startConnect() {
    setConnectingStripe(true);
    setError(null);
    try {
      const dob = normalizeDateOfBirth(form.dateOfBirth);
      if (!isAtLeast18FromDate(dob) && !form.ageVerified) {
        setError("Enter your date of birth and save your profile before setting up payouts.");
        return;
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user && dob) {
        await supabase
          .from("profiles")
          .update({ date_of_birth: dob, age_verified: true })
          .eq("id", user.id);
      }

      const res = await fetch("/api/stripe/connect", { method: "POST" });
      const body = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
      if (!res.ok || !body.url) {
        setError(body.error ?? "Could not start payout setup.");
        return;
      }
      window.location.href = body.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error");
    } finally {
      setConnectingStripe(false);
    }
  }

  async function startVerification() {
    setVerifying(true);
    setError(null);
    try {
      const res = await fetch("/api/verify/create-session", { method: "POST" });
      const body = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
      if (!res.ok || !body.url) {
        setError(body.error ?? "Could not start identity verification.");
        setVerifying(false);
        return;
      }
      window.location.href = body.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error");
      setVerifying(false);
    }
  }

  async function handleDeleteAccount() {
    const confirmed = window.confirm(
      "Delete your profile permanently? This cannot be undone. All your matches and data will be removed.",
    );
    if (!confirmed) return;

    setDeleting(true);
    setError(null);
    try {
      const { error: deleteError } = await supabase.rpc("delete_self_user");
      if (deleteError) throw deleteError;
      await supabase.auth.signOut();
      router.push("/");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete your profile.");
      setDeleting(false);
    }
  }

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSaving(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      let avatarUrl = form.avatarUrl;
      if (avatarFile) {
        avatarUrl = await uploadAvatar(user.id, avatarFile);
      }

      const nextForm = { ...form, avatarUrl };
      if (!nextForm.dateOfBirth.trim()) {
        setError("Please enter your date of birth.");
        return;
      }
      if (!isAtLeast18FromDate(nextForm.dateOfBirth)) {
        setError(`You must be 18 or older to join ${BRAND_NAME}.`);
        return;
      }

      const { data: freshProfile } = await supabase
        .from("profiles")
        .select("id_verified")
        .eq("id", user.id)
        .maybeSingle();

      let idVerified = freshProfile?.id_verified ?? nextForm.idVerified;
      try {
        const syncRes = await fetch("/api/verify/sync-status", { method: "POST" });
        const syncData = (await syncRes.json().catch(() => ({}))) as { id_verified?: boolean };
        if (syncRes.ok && syncData.id_verified) {
          idVerified = true;
        }
      } catch {
        // Continue with the latest row we already loaded.
      }

      let resolvedRole = nextForm.role ?? parseAppRole(user.user_metadata?.role);
      if (!resolvedRole) {
        resolvedRole =
          (await ensureProfileRole(supabase, user.id, {
            profileRole: nextForm.role,
            metadataRole: user.user_metadata?.role,
          })) ?? null;
      }

      const mergedForm = {
        ...nextForm,
        role: resolvedRole,
        idVerified,
      };

      const snapshot = profileSnapshot(mergedForm);
      const active = isProfileComplete(snapshot);
      const activityUpdate = buildActivityUpdate(snapshot);

      const { error: updateError } = await supabase.from("profiles").upsert({
        id: user.id,
        role: mergedForm.role,
        first_name: snapshot.first_name,
        last_name: snapshot.last_name,
        full_name: buildFullName(mergedForm.firstName, mergedForm.lastName),
        origin_location: snapshot.origin_location,
        neighborhood: snapshot.neighborhood,
        phone: mergedForm.phone.trim() || null,
        contact_email: mergedForm.contactEmail.trim() || null,
        bio: snapshot.bio,
        date_of_birth: normalizeDateOfBirth(mergedForm.dateOfBirth),
        age_verified: snapshot.age_verified,
        id_verified: mergedForm.idVerified,
        avatar_url: avatarUrl,
        ...activityUpdate,
        is_active: active,
        inactivity_warning_sent_at: null,
      });

      if (updateError) {
        setError(
          updateError.message.includes("date_of_birth")
            ? "Database is missing date_of_birth. Run supabase/schema.sql in the Supabase SQL editor."
            : updateError.message,
        );
        return;
      }

      setForm({
        ...mergedForm,
        avatarUrl,
        ageVerified: snapshot.age_verified,
        isActive: active,
        lastActivityAt: activityUpdate.last_activity_at,
      });
      setAvatarFile(null);
      if (avatarPreview) URL.revokeObjectURL(avatarPreview);
      setAvatarPreview(null);
      if (active) setIsEditing(false);
      setIsAsleep(false);

      const missing = profileMissingReasons(mergedForm);
      setSuccess(
        active
          ? "Your account is active! You now appear in the directory."
          : missing.length
            ? `Saved. Still needed to activate: ${missing.join(", ")}.`
            : "Profile saved.",
      );
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? `Photo upload failed: ${err.message}` : "Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center bg-white">
        <Loader2 className="h-5 w-5 animate-spin text-[#002FA7]" />
      </main>
    );
  }

  const shownAvatar = avatarPreview ?? form.avatarUrl;
  const fullName = buildFullName(form.firstName, form.lastName) || "Walk In member";
  const ageRequirementMet =
    isAtLeast18FromDate(form.dateOfBirth) || form.ageVerified;
  const canSetUpPayouts = ageRequirementMet;
  const isVerified =
    form.role === "Host"
      ? form.payoutsEnabled || ageRequirementMet
      : form.idVerified && ageRequirementMet;
  const profileDone = complete(form);
  const activationBlockers = profileMissingReasons(form);

  const lastActiveText = form.lastActivityAt
    ? new Date(form.lastActivityAt).toLocaleDateString("en-IE", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "No records";

  if (profileDone && !isEditing && !isAsleep) {
    const activeLocation =
      form.role === "Host" || form.role === "Guest"
        ? formatDirectoryLocation(
            { neighborhood: form.neighborhood, origin_location: form.originLocation },
            form.role,
          )
        : null;

    return (
      <main className={`${PAGE_SHELL} font-sans text-slate-950`}>

        <div className={PAGE_MAIN}>
          <div className="flex flex-col gap-6 border-b border-slate-200/80 pb-10 md:flex-row md:items-start md:justify-between">
            <div>
              <h1 className={heroTitle}>
                Your profile
              </h1>
              <p className="mt-3 flex items-center gap-2 text-base text-slate-600 sm:text-lg">
                <Clock className="h-5 w-5 text-[#002FA7]" />
                Last active {lastActiveText}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="inline-flex items-center gap-2 text-base font-medium text-[#002FA7] underline decoration-[#002FA7]/35 underline-offset-4 hover:decoration-[#002FA7] sm:text-lg"
              >
                <Edit2 className="h-4 w-4" />
                Edit
              </button>
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={deleting}
                className="inline-flex items-center gap-2 text-base font-medium text-red-600 hover:underline disabled:opacity-50 sm:text-lg"
              >
                {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                Delete account
              </button>
            </div>
          </div>

          <div className="mt-12 grid items-start gap-12 md:grid-cols-12">
            <div className="md:col-span-4 flex flex-col items-center md:items-start text-center md:text-left">
              <div className="h-40 w-40 overflow-hidden rounded-full bg-slate-100 sm:h-44 sm:w-44">
                {form.avatarUrl ? (
                  <img src={form.avatarUrl} alt={fullName} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-4xl font-light text-slate-400">
                    {form.firstName.charAt(0) || "?"}
                  </div>
                )}
              </div>

              {isVerified && (
                <p className="mt-4 flex items-center gap-2 text-base text-emerald-700 sm:text-lg">
                  <ShieldCheck className="h-5 w-5" />
                  Verified · 18+
                </p>
              )}

            </div>

            <div className="md:col-span-8 space-y-8">
              <div>
                <p className={fieldLabel}>Name</p>
                <p className="mt-1 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">{fullName}</p>
              </div>

              <div className="grid grid-cols-2 gap-8 border-t border-slate-200/80 pt-8">
                <div>
                  <p className={fieldLabel}>Role</p>
                  <p className="mt-1 text-lg text-[#002FA7] sm:text-xl">{form.role}</p>
                </div>
                <div>
                  <p className={fieldLabel}>Location</p>
                  <p className="mt-1 text-lg text-slate-950 sm:text-xl">{activeLocation || "Not set"}</p>
                </div>
                <div>
                  <p className={fieldLabel}>{form.role === "Host" ? "Payouts" : "Identity"}</p>
                  <p className="mt-1 text-lg text-slate-950 sm:text-xl">
                    {form.role === "Host"
                      ? form.payoutsEnabled
                        ? "Stripe payouts active"
                        : "Added when you accept your first visit"
                      : form.idVerified
                        ? "Verified (18+)"
                        : "Verification required"}
                  </p>
                </div>
                <div>
                  <p className={fieldLabel}>Status</p>
                  <p className="mt-1 text-lg text-slate-950 sm:text-xl">
                    {form.isActive ? "Active" : "Not yet active"}
                  </p>
                </div>
              </div>

              {form.bio && (
                <div className="border-t border-slate-200/80 pt-8">
                  <p className={fieldLabel}>About you</p>
                  <p className="mt-3 text-lg leading-relaxed text-slate-950 whitespace-pre-line sm:text-xl sm:leading-[1.65]">
                    {form.bio}
                  </p>
                </div>
              )}

              <div className="border-t border-slate-200/80 pt-8 grid sm:grid-cols-2 gap-8">
                <div>
                  <p className={fieldLabel}>Phone</p>
                  <p className="mt-1 text-lg text-slate-700 sm:text-xl">{form.phone || "—"}</p>
                </div>
                <div>
                  <p className={fieldLabel}>Email</p>
                  <p className="mt-1 text-lg text-slate-700 break-all sm:text-xl">{form.contactEmail || "—"}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-16 border-t border-slate-200/80 pt-10">
            <Link href={form.role === "Host" ? "/guest-directory" : "/host-directory"} className={homePrimaryButton}>
              Browse {form.role === "Host" ? "guests" : "hosts"}
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className={`${PAGE_SHELL} font-sans text-slate-950`}>

      <div className={`${PAGE_MAIN}`}>
        <div className="flex items-start gap-4 border-b border-slate-200/80 pb-8">
          {profileDone && isEditing && (
            <button
              type="button"
              onClick={() => {
                setAvatarFile(null);
                if (avatarPreview) URL.revokeObjectURL(avatarPreview);
                setAvatarPreview(null);
                setIsEditing(false);
              }}
              className="mt-1.5 rounded-full p-2 text-slate-400 hover:bg-slate-50 hover:text-slate-900 transition-colors"
              aria-label="Back to details"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
          )}
          <div>
            <h1 className={heroTitle}>
              {isAsleep ? "Restore your profile" : isEditing ? "Edit profile" : "Complete your profile"}
            </h1>
            <p className="mt-3 text-base leading-relaxed text-slate-600 sm:text-[17px] sm:leading-[1.65]">
              {isAsleep
                ? "Your profile has been temporarily hidden. Wake it up to rejoin the directories."
                : "Add your details below. When you&apos;re ready, activate to show up in the directory."}
            </p>
          </div>
        </div>

        {isAsleep ? (
          <div className="mt-8 border-b border-slate-200/80 pb-8 flex flex-col gap-4">
            <div className="flex items-start gap-3">
              <Moon className="h-5 w-5 text-[#002FA7] shrink-0 mt-0.5" />
              <div>
                <h3 className={heroTitle}>Your profile is currently asleep</h3>
                <p className="mt-1 text-xs text-slate-500 leading-relaxed font-light">
                  Because you haven&apos;t visited in over {INACTIVITY_SLEEP_DAYS} days, we hid your profile to keep directories fresh. Restoration is instant and won&apos;t change your settings.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleWakeUp}
              disabled={saving}
              className={`mt-4 w-full sm:w-auto ${homePrimaryButton} disabled:opacity-50`}
            >
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
              Wake Profile Up
            </button>
          </div>
        ) : (
          <div className="mt-6 flex flex-col gap-3 border-b border-slate-200/80 pb-8 text-slate-700">
            <div className="flex items-start gap-3">
              <Lock className="h-4 w-4 mt-0.5 text-slate-400 shrink-0 stroke-[1.5]" />
              <div className="text-xs font-light leading-relaxed text-slate-500">
                Your profile details are private. Complete the fields below, then click Activate Account to appear in the directory.
              </div>
            </div>
            <div className="border-t border-slate-100 pt-3 flex flex-col gap-2">
              <div className="flex items-center gap-2 text-[9px] font-mono uppercase tracking-wider text-[#002FA7]">
                <Moon className="h-3.5 w-3.5" />
                <span>Auto-Sleep Mode: {INACTIVITY_SLEEP_DAYS} Days of Inactivity</span>
              </div>
              <div className="flex items-center gap-2 text-[9px] font-mono uppercase tracking-wider text-red-500">
                <Trash2 className="h-3.5 w-3.5" />
                <span>Auto-Deletion: {INACTIVITY_DELETE_DAYS} Days of Inactivity</span>
              </div>
            </div>
          </div>
        )}

        {!isAsleep && (
          <form onSubmit={handleSave} className="mt-10 space-y-8">
            <div className="flex flex-col items-center">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="group relative h-28 w-28 overflow-hidden rounded-full bg-slate-50 ring-1 ring-slate-200 hover:ring-[#002FA7] transition-all duration-300 shadow-sm"
                aria-label="Upload profile photo"
              >
                {shownAvatar ? (
                  <img src={shownAvatar} alt="Profile preview" className="h-full w-full object-cover" />
                ) : (
                  <span className="flex h-full w-full items-center justify-center text-slate-400 group-hover:text-[#002FA7] transition-colors duration-300">
                    <Camera className="h-5 w-5 stroke-[1.25]" />
                  </span>
                )}
              </button>
              <input ref={fileRef} type="file" onChange={onPhoto} className="hidden" />
              <p className="mt-3 text-sm text-slate-600">Profile photo (max 5MB)</p>

              <div className="mt-6 w-full max-w-md text-center sm:text-left">
                {form.role === "Host" ? (
                  <p className="text-xs text-slate-500 font-light leading-relaxed">
                    No Stripe setup needed to go live. We&apos;ll ask for your bank details only when you accept a paid visit.
                  </p>
                ) : form.idVerified ? (
                  <p className="flex items-center justify-center gap-2 text-sm text-emerald-700 sm:justify-start">
                    <ShieldCheck className="h-4 w-4" />
                    Identity verified
                  </p>
                ) : verificationPolling ? (
                  <p className="text-sm text-amber-600 font-light flex items-center justify-center gap-2">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Syncing with Stripe…
                  </p>
                ) : (
                  <>
                    <p className="text-xs text-slate-500 font-light leading-relaxed">
                      Required — verify your identity with Stripe before you can activate your profile.
                    </p>
                    <button
                      type="button"
                      onClick={startVerification}
                      disabled={verifying}
                      className={`mt-3 ${homePrimaryButton} disabled:opacity-50`}
                    >
                      {verifying ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ShieldCheck className="h-3.5 w-3.5" />}
                      {verifying ? "Loading..." : "Verify Identity"}
                    </button>
                    <p className="mt-3 text-[11px] text-slate-400 font-light leading-relaxed">
                      Blurry photo or expired document?{" "}
                      <button
                        type="button"
                        onClick={requestManualReview}
                        disabled={requestingManualReview}
                        className="text-[#002FA7] font-medium hover:underline disabled:opacity-50"
                      >
                        {requestingManualReview ? "Requesting…" : "Request manual review"}
                      </button>
                    </p>
                  </>
                )}
              </div>
            </div>

            {!form.role && (
              <fieldset>
                <legend className={`mb-3 ${fieldLabel}`}>I&apos;m joining as</legend>
                <div className="flex flex-col border-t border-slate-200/80 sm:flex-row sm:gap-8">
                  {(["Guest", "Host"] as Role[]).map((r) => (
                    <label
                      key={r}
                      className={`cursor-pointer border-b border-slate-200/80 py-4 text-sm sm:border-b-0 sm:py-0 ${
                        form.role === r ? "font-semibold text-[#002FA7]" : "text-slate-700"
                      }`}
                    >
                      <input
                        type="radio"
                        name="role"
                        checked={form.role === r}
                        onChange={() => setForm((p) => ({ ...p, role: r }))}
                        className="sr-only"
                      />
                      <span>{r === "Guest" ? "Guest (backpacker)" : "Host (local)"}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="firstName" className={fieldLabel}>
                  First Name
                </label>
                <input
                  id="firstName"
                  required
                  value={form.firstName}
                  onChange={(e) => setForm((p) => ({ ...p, firstName: e.target.value }))}
                  className={inputClass}
                  placeholder="Jane"
                />
              </div>
              <div>
                <label htmlFor="lastName" className={fieldLabel}>
                  Surname
                </label>
                <input
                  id="lastName"
                  required
                  value={form.lastName}
                  onChange={(e) => setForm((p) => ({ ...p, lastName: e.target.value }))}
                  className={inputClass}
                  placeholder="Doe"
                />
              </div>
            </div>

            {form.role === "Host" ? (
              <div>
                <label htmlFor="neighborhood" className={fieldLabel}>
                  General Area of your Dublin Home
                </label>
                <input
                  id="neighborhood"
                  list="dublin-areas"
                  required
                  value={form.neighborhood}
                  onChange={(e) => setForm((p) => ({ ...p, neighborhood: e.target.value }))}
                  className={inputClass}
                  placeholder="Select or type a Dublin area…"
                />
                <datalist id="dublin-areas">
                  {DUBLIN_AREAS.map((area) => (
                    <option key={area} value={area} />
                  ))}
                </datalist>
              </div>
            ) : form.role === "Guest" ? (
              <div>
                <label htmlFor="origin" className={fieldLabel}>
                  Where are you from?
                </label>
                <input
                  id="origin"
                  list="countries"
                  required
                  value={form.originLocation}
                  onChange={(e) => setForm((p) => ({ ...p, originLocation: e.target.value }))}
                  className={inputClass}
                  placeholder="Select or type your country…"
                />
                <datalist id="countries">
                  {COUNTRIES.map((country) => (
                    <option key={country} value={country} />
                  ))}
                </datalist>
              </div>
            ) : null}

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="phone" className={fieldLabel}>
                  Phone <span className="text-slate-400 font-light normal-case">(private)</span>
                </label>
                <input
                  id="phone"
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                  className={inputClass}
                  placeholder="+353 …"
                />
              </div>
              <div>
                <label htmlFor="cemail" className={fieldLabel}>
                  Contact Email <span className="text-slate-400 font-light normal-case">(private)</span>
                </label>
                <input
                  id="cemail"
                  type="email"
                  value={form.contactEmail}
                  onChange={(e) => setForm((p) => ({ ...p, contactEmail: e.target.value }))}
                  className={inputClass}
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="bio" className={fieldLabel}>
                Your Story
              </label>
              <textarea
                id="bio"
                rows={5}
                required
                value={form.bio}
                onChange={(e) => setForm((p) => ({ ...p, bio: e.target.value }))}
                className={`${inputClass} resize-none`}
                placeholder="Tell us a bit about yourself..."
              />
            </div>

            <div>
              <label htmlFor="dob" className={fieldLabel}>
                Date of Birth <span className="text-slate-400 font-light normal-case">(must be 18+)</span>
              </label>
              <input
                id="dob"
                type="date"
                required
                max={maxDateOfBirthFor18Plus()}
                value={form.dateOfBirth}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    dateOfBirth: e.target.value,
                    ageVerified: isAtLeast18FromDate(e.target.value),
                  }))
                }
                className={inputClass}
              />
              {form.dateOfBirth && !isAtLeast18FromDate(form.dateOfBirth) && (
                <p className="mt-2 text-xs text-rose-600 font-light">You must be 18 or older to join.</p>
              )}
              {form.dateOfBirth && isAtLeast18FromDate(form.dateOfBirth) && (
                <p className="mt-2 text-xs text-emerald-600 font-light">✓ Age requirement met</p>
              )}
            </div>

            {form.role === "Host" && form.payoutsEnabled && (
              <div className="border-t border-slate-200/80 pt-8">
                <div className="flex items-center gap-2.5">
                  <CreditCard className="h-5 w-5 stroke-[1.5] text-slate-800" />
                  <h2 className={siteTitleSm}>Host payouts</h2>
                </div>
                <p className="mt-2 text-sm text-slate-600 font-light">
                  ✓ Your Stripe payout account is active.
                </p>
              </div>
            )}

            {error && (
              <p className="text-sm text-red-600 font-light" role="alert">
                {error}
              </p>
            )}
            {success && <p className="text-sm text-emerald-600 font-light">{success}</p>}

            {!profileDone && activationBlockers.length > 0 && (
              <p className="text-sm text-amber-800">
                To activate: {activationBlockers.join(", ")}.
              </p>
            )}

            <div className="flex flex-col gap-3 border-t border-slate-200/80 pt-8 sm:flex-row sm:items-center">
              <button
                type="submit"
                disabled={saving}
                className={`flex flex-1 items-center justify-center gap-2 ${homePrimaryButton} disabled:cursor-not-allowed disabled:opacity-50`}
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin text-white" />}
                {profileDone ? "Activate Account" : "Save Details"}
              </button>

              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={deleting || saving}
                className="inline-flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-red-600 hover:underline disabled:cursor-not-allowed disabled:opacity-50 sm:min-w-[140px]"
              >
                {deleting ? <Loader2 className="h-4 w-4 animate-spin text-red-600" /> : <Trash2 className="h-4 w-4" />}
                Delete Profile
              </button>
            </div>
          </form>
        )}
      </div>
    </main>
  );
}
