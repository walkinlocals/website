"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { buildFullName, isProfileComplete, isBrowsableProfile, isAtLeast18FromDate, maxDateOfBirthFor18Plus, normalizeDateOfBirth, profileActivationBlockers } from "@/lib/profile";
import { PAGE_BG_DOTS, PAGE_CONTAINER, PAGE_SHELL } from "@/lib/page-layout";
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
  "mt-1.5 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm text-slate-950 focus:border-[#002FA7] focus:outline-none focus:ring-1 focus:ring-[#002FA7] transition-all duration-300 shadow-[0_4px_15px_rgba(0,47,167,0.01)] font-light placeholder:text-slate-400";

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
        setError("You must be 18 or older to join WalkIn Locals.");
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
      <main className={PAGE_SHELL}>
        <div className={PAGE_BG_DOTS} />

        <div className={PAGE_CONTAINER}>
          <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-100 pb-12 gap-6">
            <div>
              <h1 className="font-serif text-4xl font-normal tracking-tight text-slate-950">Your Details</h1>
              <div className="mt-3 flex items-center gap-2 text-slate-400 font-mono text-[10px] uppercase tracking-wider">
                <Clock className="h-3.5 w-3.5 text-[#002FA7]" />
                <span>Last Activity: {lastActiveText}</span>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-2.5 text-xs font-medium text-slate-700 shadow-sm transition-all duration-300 hover:bg-slate-50 hover:border-slate-300"
              >
                <Edit2 className="h-3 w-3 text-slate-400" />
                Edit Profile
              </button>
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={deleting}
                className="inline-flex items-center gap-2 rounded-full border border-red-200 bg-white px-5 py-2.5 text-xs font-semibold font-mono uppercase tracking-widest text-red-600 transition-all duration-300 hover:bg-red-50 disabled:opacity-50"
              >
                {deleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                Delete Profile
              </button>
            </div>
          </div>

          <div className="mt-16 grid md:grid-cols-12 gap-12 items-start">
            <div className="md:col-span-4 flex flex-col items-center md:items-start text-center md:text-left">
              <div className="h-36 w-36 overflow-hidden rounded-full bg-slate-50 border border-slate-200 shadow-sm">
                {form.avatarUrl ? (
                  <img src={form.avatarUrl} alt={fullName} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-4xl font-light text-slate-400">
                    {form.firstName.charAt(0) || "?"}
                  </div>
                )}
              </div>

              {isVerified && (
                <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50/50 px-3.5 py-1.5">
                  <ShieldCheck className="h-4 w-4 text-emerald-600 stroke-[1.5]" />
                  <span className="text-[11px] font-medium tracking-wide text-emerald-700">
                    Verified Member (18+)
                  </span>
                </div>
              )}

            </div>

            <div className="md:col-span-8 space-y-10">
              <div>
                <span className="text-[10px] uppercase tracking-[0.3em] font-semibold text-[#002FA7] font-mono">Name</span>
                <h2 className="font-serif text-3xl font-normal text-slate-950 mt-1">{fullName}</h2>
              </div>

              <div className="grid grid-cols-2 gap-8 border-t border-slate-100 pt-8">
                <div>
                  <span className="text-[10px] uppercase tracking-[0.3em] font-semibold text-[#002FA7] font-mono">Community Role</span>
                  <p className="font-serif text-lg text-[#002FA7] mt-1 italic">{form.role}</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase tracking-[0.3em] font-semibold text-[#002FA7] font-mono">Location</span>
                  <p className="font-serif text-lg text-slate-800 mt-1">{activeLocation || "Not declared"}</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase tracking-[0.3em] font-semibold text-[#002FA7] font-mono">
                    {form.role === "Host" ? "Payouts" : "Identity"}
                  </span>
                  <p className="font-serif text-lg text-slate-800 mt-1">
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
                  <span className="text-[10px] uppercase tracking-[0.3em] font-semibold text-[#002FA7] font-mono">Status</span>
                  <p className="font-serif text-lg text-slate-800 mt-1">
                    {form.isActive ? "Active in directory" : "Not yet active"}
                  </p>
                </div>
              </div>

              {form.bio && (
                <div className="border-t border-slate-100 pt-8">
                  <span className="text-[10px] uppercase tracking-[0.3em] font-semibold text-[#002FA7] font-mono">The Story</span>
                  <p className="mt-4 font-serif text-lg text-slate-800 leading-relaxed italic whitespace-pre-line">
                    &ldquo;{form.bio}&rdquo;
                  </p>
                </div>
              )}

              <div className="border-t border-slate-100 pt-8 grid sm:grid-cols-2 gap-8">
                <div>
                  <span className="text-[10px] uppercase tracking-[0.3em] font-semibold text-slate-400 font-mono">Phone</span>
                  <p className="mt-2 text-sm text-slate-600 font-light tracking-wide">{form.phone || "—"}</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase tracking-[0.3em] font-semibold text-slate-400 font-mono">Direct Email</span>
                  <p className="mt-2 text-sm text-slate-600 font-light break-all tracking-wide">{form.contactEmail || "—"}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-28 border-t border-slate-100 pt-12 flex justify-end">
            <Link
              href={form.role === "Host" ? "/guest-directory" : "/host-directory"}
              className="group inline-flex items-center gap-3 rounded-full bg-[#002FA7] px-8 py-4 text-xs font-semibold font-mono uppercase tracking-widest text-white transition-all duration-300 hover:bg-[#001e6c] hover:scale-[1.01] shadow-[0_4px_15px_rgba(0,47,167,0.18)]"
            >
              <span>Browse {form.role === "Host" ? "Guests" : "Hosts"}</span>
              <span className="text-sm transition-transform duration-300 group-hover:translate-x-1.5">→</span>
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className={PAGE_SHELL}>
      <div className={PAGE_BG_DOTS} />

      <div className={PAGE_CONTAINER}>
        <div className="flex items-start gap-4 border-b border-slate-100 pb-8">
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
            <h1 className="font-serif text-3xl font-normal tracking-tight text-slate-950">
              {isAsleep ? "Restore Profile" : "Edit Profile"}
            </h1>
            <p className="mt-2 text-sm text-slate-500 font-light leading-relaxed">
              {isAsleep
                ? "Your profile has been temporarily hidden. Wake it up to rejoin the directories."
                : "Fill in details below to customize your presence in the Walkinlocals community."}
            </p>
          </div>
        </div>

        {isAsleep ? (
          <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col gap-4">
            <div className="flex items-start gap-3">
              <Moon className="h-5 w-5 text-[#002FA7] shrink-0 mt-0.5" />
              <div>
                <h3 className="font-serif text-base font-normal text-slate-950">Your profile is currently asleep</h3>
                <p className="mt-1 text-xs text-slate-500 leading-relaxed font-light">
                  Because you haven&apos;t visited in over {INACTIVITY_SLEEP_DAYS} days, we hid your profile to keep directories fresh. Restoration is instant and won&apos;t change your settings.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleWakeUp}
              disabled={saving}
              className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-[#002FA7] py-4 text-xs font-semibold font-mono uppercase tracking-widest text-white transition-all duration-300 hover:bg-[#001e6c] disabled:opacity-50 shadow-[0_4px_15px_rgba(0,47,167,0.18)]"
            >
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
              Wake Profile Up
            </button>
          </div>
        ) : (
          <div className="mt-6 flex flex-col gap-3 rounded-3xl border border-slate-200 bg-white p-6 text-slate-700 shadow-sm">
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
              <p className="mt-3 text-[10px] tracking-[0.25em] uppercase font-semibold text-slate-400 font-mono">
                Profile photo (max 5MB)
              </p>

              <div className="mt-5 w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-4 shadow-sm text-center">
                {form.role === "Host" ? (
                  <p className="text-xs text-slate-500 font-light leading-relaxed">
                    No Stripe setup needed to go live. We&apos;ll ask for your bank details only when you accept a paid visit.
                  </p>
                ) : form.idVerified ? (
                  <div className="inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50/50 px-3.5 py-1.5">
                    <ShieldCheck className="h-4 w-4 text-emerald-600 stroke-[1.5]" />
                    <span className="text-[11px] font-medium tracking-wide text-emerald-700">
                      Identity verified
                    </span>
                  </div>
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
                      className="mt-3 inline-flex items-center gap-2 rounded-full bg-[#002FA7] px-5 py-2.5 text-[10px] font-semibold font-mono uppercase tracking-widest text-white transition-all duration-300 hover:bg-[#001e6c] disabled:opacity-50"
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
                <legend className="mb-3 block text-sm font-medium text-slate-800">I am joining as a…</legend>
                <div className="grid grid-cols-2 gap-3">
                  {(["Guest", "Host"] as Role[]).map((r) => (
                    <label
                      key={r}
                      className={`cursor-pointer rounded-2xl border p-4 text-sm transition-all duration-300 ${
                        form.role === r
                          ? "border-[#002FA7] bg-[#002fa7]/5 ring-1 ring-[#002FA7]"
                          : "border-slate-200 bg-white hover:border-slate-300 shadow-sm"
                      }`}
                    >
                      <input
                        type="radio"
                        name="role"
                        checked={form.role === r}
                        onChange={() => setForm((p) => ({ ...p, role: r }))}
                        className="sr-only"
                      />
                      <span className="block font-medium">
                        {r === "Guest" ? "Guest (Traveler)" : "Host (Local Guide)"}
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="firstName" className="block text-xs uppercase tracking-[0.2em] font-semibold text-slate-400 font-mono">
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
                <label htmlFor="lastName" className="block text-xs uppercase tracking-[0.2em] font-semibold text-slate-400 font-mono">
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
                <label htmlFor="neighborhood" className="block text-xs uppercase tracking-[0.2em] font-semibold text-slate-400 font-mono">
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
                <label htmlFor="origin" className="block text-xs uppercase tracking-[0.2em] font-semibold text-slate-400 font-mono">
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
                <label htmlFor="phone" className="block text-xs uppercase tracking-[0.2em] font-semibold text-slate-400 font-mono">
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
                <label htmlFor="cemail" className="block text-xs uppercase tracking-[0.2em] font-semibold text-slate-400 font-mono">
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
              <label htmlFor="bio" className="block text-xs uppercase tracking-[0.2em] font-semibold text-slate-400 font-mono">
                Your Story
              </label>
              <textarea
                id="bio"
                rows={5}
                required
                value={form.bio}
                onChange={(e) => setForm((p) => ({ ...p, bio: e.target.value }))}
                className="mt-1.5 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm text-slate-950 focus:border-[#002FA7] focus:outline-none focus:ring-1 focus:ring-[#002FA7] transition-all duration-300 shadow-[0_4px_15px_rgba(0,47,167,0.01)] font-light placeholder:text-slate-400 resize-none"
                placeholder="Tell us a bit about yourself..."
              />
            </div>

            <div>
              <label htmlFor="dob" className="block text-xs uppercase tracking-[0.2em] font-semibold text-slate-400 font-mono">
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
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-2.5">
                  <CreditCard className="h-5 w-5 stroke-[1.5] text-slate-800" />
                  <h2 className="text-xs uppercase tracking-[0.2em] font-semibold text-slate-850 font-mono">
                    Host Payouts
                  </h2>
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
              <div className="rounded-2xl border border-amber-100 bg-amber-50/60 px-4 py-3 text-sm text-amber-800 font-light">
                To activate your account: {activationBlockers.join(", ")}.
              </div>
            )}

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="submit"
                disabled={saving}
                className="flex flex-1 items-center justify-center gap-2 rounded-full bg-[#002FA7] px-6 py-4 text-xs font-semibold font-mono uppercase tracking-widest text-white transition-all duration-300 hover:bg-[#001e6c] shadow-md disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin text-white" />}
                {profileDone ? "Activate Account" : "Save Details"}
              </button>

              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={deleting || saving}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-red-200 bg-white px-6 py-4 text-xs font-semibold font-mono uppercase tracking-widest text-red-600 transition-all duration-300 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 sm:min-w-[200px]"
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
