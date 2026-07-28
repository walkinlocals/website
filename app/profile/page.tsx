"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
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
  Heart
} from "lucide-react";

type Role = "Guest" | "Host";

interface Form {
  role: Role | null;
  fullName: string;
  originLocation: string;
  neighborhood: string;
  phone: string;
  contactEmail: string;
  bio: string;
  avatarUrl: string | null;
  idVerified: boolean;
  isActive: boolean;
  lastActivityAt: string | null;
}

const EMPTY: Form = {
  role: null,
  fullName: "",
  originLocation: "",
  neighborhood: "",
  phone: "",
  contactEmail: "",
  bio: "",
  avatarUrl: null,
  idVerified: false,
  isActive: false,
  lastActivityAt: null,
};

export default function ProfileHubPage() {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [form, setForm] = useState<Form>(EMPTY);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isAsleep, setIsAsleep] = useState(false);

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
            "role, full_name, origin_location, neighborhood, phone, contact_email, bio, avatar_url, id_verified, is_active, last_activity_at",
          )
          .eq("id", user.id)
          .single();

        if (fetchError) throw fetchError;

        let shouldSignOut = false;
        let sleepTriggered = false;
        const nowString = new Date().toISOString();

        if (initialData?.last_activity_at) {
          const lastActiveDate = new Date(initialData.last_activity_at);
          const currentDate = new Date();
          const diffTime = Math.abs(currentDate.getTime() - lastActiveDate.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

          if (diffDays >= 90) {
            shouldSignOut = true;
            await supabase.rpc("delete_self_user");
            await supabase.auth.signOut();
            router.push("/login?message=deleted_due_to_inactivity");
            return;
          }

          if (diffDays >= 30 && initialData.is_active) {
            sleepTriggered = true;
            await supabase
              .from("profiles")
              .update({ is_active: false })
              .eq("id", user.id);
            initialData.is_active = false;
          }
        }

        if (shouldSignOut) return;

        await supabase
          .from("profiles")
          .update({ last_activity_at: nowString })
          .eq("id", user.id);

        let role: Role | null =
          initialData?.role === "Guest" || initialData?.role === "Host" ? initialData.role : null;

        const pending = window.localStorage.getItem("walkin_pending_role");
        if (!role && (pending === "Guest" || pending === "Host")) {
          await supabase.from("profiles").update({ role: pending }).eq("id", user.id);
          role = pending;
        }
        window.localStorage.removeItem("walkin_pending_role");

        if (!active) return;
        setForm({
          role,
          fullName: initialData?.full_name ?? "",
          originLocation: initialData?.origin_location ?? "",
          neighborhood: initialData?.neighborhood ?? "",
          phone: initialData?.phone ?? "",
          contactEmail: initialData?.contact_email ?? user.email ?? "",
          bio: initialData?.bio ?? "",
          avatarUrl: initialData?.avatar_url ?? null,
          idVerified: initialData?.id_verified ?? false,
          isActive: initialData?.is_active ?? false,
          lastActivityAt: nowString,
        });

        if (sleepTriggered) {
          setIsAsleep(true);
        }
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
  }, [router]);

  function isComplete(f: Form): boolean {
    const location = f.role === "Guest" ? f.originLocation : f.neighborhood;
    return Boolean(
      f.role &&
        f.fullName.trim() &&
        f.phone.trim() &&
        f.contactEmail.trim() &&
        location.trim() &&
        (f.avatarUrl || avatarFile) &&
        f.idVerified,
    );
  }

  async function handleWakeUp() {
    setSaving(true);
    setError(null);
    try {
      const nowString = new Date().toISOString();
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          is_active: true,
          last_activity_at: nowString
        })
        .eq("id", (await supabase.auth.getUser()).data.user?.id);

      if (updateError) throw updateError;

      setForm(prev => ({ ...prev, isActive: true, lastActivityAt: nowString }));
      setIsAsleep(false);
      setSuccess("Welcome back! Your profile has been restored to the directories.");
    } catch (err) {
      setError("Could not restore your profile.");
    } finally {
      setSaving(false);
    }
  }

  function onPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setAvatarFile(file);
    if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    setAvatarPreview(file ? URL.createObjectURL(file) : null);
  }

  async function uploadAvatar(userId: string, file: File): Promise<string> {
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `${userId}/avatar.${ext}`;
    const { error } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true, contentType: file.type });
    if (error) throw error;
    return supabase.storage.from("avatars").getPublicUrl(path).data.publicUrl;
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
      const active = isComplete(nextForm);
      const nowString = new Date().toISOString();

      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          role: form.role,
          full_name: form.fullName || null,
          origin_location: form.role === "Guest" ? form.originLocation || null : null,
          neighborhood: form.role === "Host" ? form.neighborhood || null : null,
          phone: form.phone || null,
          contact_email: form.contactEmail || null,
          bio: form.bio || null,
          avatar_url: avatarUrl,
          is_active: active,
          last_activity_at: nowString,
        })
        .eq("id", user.id);

      if (updateError) {
        setError(updateError.message);
        return;
      }

      setForm({ ...nextForm, isActive: active, lastActivityAt: nowString });
      setAvatarFile(null);
      setIsEditing(false);
      setSuccess(active ? "Your profile is active!" : "Saved. Complete the remaining steps to activate.");
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

  const inputClass =
    "mt-1.5 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm text-slate-950 focus:border-[#002FA7] focus:outline-none focus:ring-1 focus:ring-[#002FA7] transition-all duration-300 shadow-[0_4px_15px_rgba(0,47,167,0.01)] font-light placeholder:text-slate-400";
  const shownAvatar = avatarPreview ?? form.avatarUrl;
  const complete = isComplete(form);

  const lastActiveText = form.lastActivityAt
    ? new Date(form.lastActivityAt).toLocaleDateString("en-IE", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "No records";

  // ==========================================
  // VIEW A: PREMIUM READ-ONLY DASHBOARD
  // ==========================================
  if (form.isActive && !isEditing) {
    const activeLocation = form.role === "Host" ? form.neighborhood : form.originLocation;

    return (
      <main className="bg-white min-h-screen py-20 relative selection:bg-[#002FA7] selection:text-white overflow-hidden">
        {/* Soft background blue dots */}
        <div className="pointer-events-none absolute inset-0 z-0 opacity-30 bg-[radial-gradient(#002fa709_1.5px,transparent_1.5px)] [background-size:32px_32px]" />

        <div className="relative z-10 mx-auto max-w-3xl px-8">

          {/* Header Layout */}
          <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-100 pb-12 gap-6">
            <div>
              <span className="inline-flex items-center gap-1 font-mono text-[9px] uppercase tracking-[0.3em] text-[#002FA7] font-semibold bg-[#002fa7]/5 px-3 py-1 rounded-full">
                ✦ Your Account ✦
              </span>
              <h1 className="font-serif text-4xl font-normal text-slate-950 mt-4 tracking-tight">Your Details</h1>

              <div className="mt-3 flex items-center gap-2 text-slate-400 font-mono text-[10px] uppercase tracking-wider">
                <Clock className="h-3.5 w-3.5 text-[#002FA7]" />
                <span>Last Activity: {lastActiveText}</span>
              </div>
            </div>
            <div>
              <button
                onClick={() => setIsEditing(true)}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-2.5 text-xs font-medium text-slate-700 shadow-sm transition-all duration-300 hover:bg-slate-50 hover:border-slate-300"
              >
                <Edit2 className="h-3 w-3 text-slate-400" />
                Edit Profile
              </button>
            </div>
          </div>

          {/* Premium Gallery Block */}
          <div className="mt-16 grid md:grid-cols-12 gap-12 items-start">

            <div className="md:col-span-4 flex flex-col items-center md:items-start text-center md:text-left">
              <div className="h-36 w-36 overflow-hidden rounded-3xl bg-slate-50 border border-slate-200 shadow-sm">
                {form.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={form.avatarUrl} alt={form.fullName} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-4xl font-light text-slate-400">
                    {form.fullName.charAt(0) || "?"}
                  </div>
                )}
              </div>

              {form.idVerified && (
                <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50/50 px-3.5 py-1.5">
                  <ShieldCheck className="h-4 w-4 text-emerald-600 stroke-[1.5]" />
                  <span className="text-[11px] font-medium tracking-wide text-emerald-700">
                    Verified Member
                  </span>
                </div>
              )}
            </div>

            <div className="md:col-span-8 space-y-10">

              <div>
                <span className="text-[10px] uppercase tracking-[0.3em] font-semibold text-[#002FA7] font-mono">Name</span>
                <h2 className="font-serif text-3xl font-normal text-slate-950 mt-1">{form.fullName}</h2>
              </div>

              <div className="grid grid-cols-2 gap-8 border-t border-slate-100 pt-8">
                <div>
                  <span className="text-[10px] uppercase tracking-[0.3em] font-semibold text-[#002FA7] font-mono">Community Role</span>
                  <p className="font-serif text-lg text-[#002FA7] mt-1 italic">{form.role}</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase tracking-[0.3em] font-semibold text-[#002FA7] font-mono">Location</span>
                  <p className="font-serif text-lg text-slate-800 mt-1">
                    {activeLocation ? activeLocation : "Not declared"}
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
              className="group inline-flex items-center gap-3 rounded-full bg-[#002FA7] px-8 py-4 text-xs font-semibold font-mono uppercase tracking-widest text-white transition-all duration-300 hover:bg-[#001e6c] hover:scale-[1.01] shadow-[0_4px_15px_rgba(0,47,167,0.18)]">
              <span>Browse {form.role === "Host" ? "Guests" : "Hosts"}</span>
              <span className="text-sm transition-transform duration-300 group-hover:translate-x-1.5">
                →
              </span>
            </Link>
          </div>

        </div>
      </main>
    );
  }

  // ==========================================
  // VIEW B: INTERACTIVE FORM (EDIT/INCOMPLETE)
  // ==========================================
  return (
    <main className="bg-white min-h-screen py-20 relative selection:bg-[#002FA7] selection:text-white overflow-hidden">
      {/* Background blue dots */}
      <div className="pointer-events-none absolute inset-0 z-0 opacity-30 bg-[radial-gradient(#002fa709_1.5px,transparent_1.5px)] [background-size:32px_32px]" />

      <div className="relative z-10 mx-auto max-w-xl px-8">

        <div className="flex items-start gap-4 border-b border-slate-100 pb-8">
          {form.isActive && (
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="mt-1.5 rounded-full p-2 text-slate-400 hover:bg-slate-50 hover:text-slate-900 transition-colors"
              aria-label="Back to details"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
          )}
          <div>
            <span className="inline-flex items-center gap-1 font-mono text-[9px] uppercase tracking-[0.3em] text-[#002FA7] font-semibold bg-[#002fa7]/5 px-3 py-1 rounded-full">
              ✦ WalkIn Locals ✦
            </span>
            <h1 className="font-serif text-3xl font-normal tracking-tight text-slate-950 mt-4">
              {isAsleep ? "Restore Profile" : "Edit Profile"}
            </h1>
            <p className="mt-2 text-sm text-slate-500 font-light leading-relaxed">
              {isAsleep
                ? "Your profile has been temporarily hidden. Wake it up to rejoin the directories."
                : "Fill in details below to customize your presence in the Walkinlocals community."}
            </p>
          </div>
        </div>

        {/* 1. RESTORE SLEEPING PROFILE PROMPT */}
        {isAsleep ? (
          <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col gap-4">
            <div className="flex items-start gap-3">
              <Moon className="h-5 w-5 text-[#002FA7] shrink-0 mt-0.5" />
              <div>
                <h3 className="font-serif text-base font-normal text-slate-950">Your profile is currently asleep</h3>
                <p className="mt-1 text-xs text-slate-500 leading-relaxed font-light">
                  Because you haven&apos;t visited in over a month, we hid your profile to keep directories fresh. Restoration is instant and won&apos;t change your settings.
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
          /* STANDARD LIFE-CYCLE ALERTS */
          <div className="mt-6 flex flex-col gap-3 rounded-3xl border border-slate-200 bg-white p-6 text-slate-700 shadow-sm">
            <div className="flex items-start gap-3">
              <Lock className="h-4 w-4 mt-0.5 text-slate-400 shrink-0 stroke-[1.5]" />
              <div className="text-xs font-light leading-relaxed text-slate-500">
                Your profile details are private. Fill in the registry fields and complete verification to activate.
              </div>
            </div>

            <div className="border-t border-slate-100 pt-3 flex flex-col gap-2">
              <div className="flex items-center gap-2 text-[9px] font-mono uppercase tracking-wider text-[#002FA7]">
                <Moon className="h-3.5 w-3.5" />
                <span>Auto-Sleep Mode: 1 Month of Inactivity</span>
              </div>
              <div className="flex items-center gap-2 text-[9px] font-mono uppercase tracking-wider text-red-500">
                <Trash2 className="h-3.5 w-3.5" />
                <span>Auto-Deletion: 3 Months of Inactivity</span>
              </div>
            </div>
          </div>
        )}

        {!isAsleep && (
          <form onSubmit={handleSave} className="mt-10 space-y-8">
            {/* Avatar Photo Frame */}
            <div className="flex flex-col items-center">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="group relative h-28 w-28 overflow-hidden rounded-full bg-slate-50 ring-1 ring-slate-200 hover:ring-[#002FA7] transition-all duration-300 shadow-sm"
                aria-label="Upload profile photo"
              >
                {shownAvatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={shownAvatar} alt="Profile preview" className="h-full w-full object-cover" />
                ) : (
                  <span className="flex h-full w-full items-center justify-center text-slate-400 group-hover:text-[#002FA7] transition-colors duration-300">
                    <Camera className="h-5 w-5 stroke-[1.25]" />
                  </span>
                )}
              </button>
              <input ref={fileRef} type="file" accept="image/*" onChange={onPhoto} className="hidden" />
              <p className="mt-3 text-[10px] tracking-[0.25em] uppercase font-semibold text-slate-400 font-mono">Profile photo (required)</p>
            </div>

            {/* Role Choice */}
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
                      <span className="block font-medium">{r === "Guest" ? "Guest (Backpacker)" : "Host (Local Guide)"}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
            )}

            <div>
              <label htmlFor="fullName" className="block text-xs uppercase tracking-[0.2em] font-semibold text-slate-400 font-mono">
                Name &amp; Surname
              </label>
              <input
                id="fullName"
                required
                value={form.fullName}
                onChange={(e) => setForm((p) => ({ ...p, fullName: e.target.value }))}
                className={inputClass}
                placeholder="e.g. Jane Doe"
              />
            </div>

            {form.role === "Host" ? (
              <div>
                <label htmlFor="neighborhood" className="block text-xs uppercase tracking-[0.2em] font-semibold text-slate-400 font-mono">
                  General Area of your Dublin Home
                </label>
                <input
                  id="neighborhood"
                  value={form.neighborhood}
                  onChange={(e) => setForm((p) => ({ ...p, neighborhood: e.target.value }))}
                  className={inputClass}
                  placeholder="e.g. Stoneybatter — neighborhood only"
                />
              </div>
            ) : (
              <div>
                <label htmlFor="origin" className="block text-xs uppercase tracking-[0.2em] font-semibold text-slate-400 font-mono">
                  Where are you from?
                </label>
                <input
                  id="origin"
                  value={form.originLocation}
                  onChange={(e) => setForm((p) => ({ ...p, originLocation: e.target.value }))}
                  className={inputClass}
                  placeholder="e.g. Lisbon, Portugal"
                />
              </div>
            )}

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
                Your Story <span className="text-slate-400 font-light normal-case">(optional)</span>
              </label>
              <textarea
                id="bio"
                rows={5}
                value={form.bio}
                onChange={(e) => setForm((p) => ({ ...p, bio: e.target.value }))}
                className="mt-1.5 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm text-slate-950 focus:border-[#002FA7] focus:outline-none focus:ring-1 focus:ring-[#002FA7] transition-all duration-300 shadow-[0_4px_15px_rgba(0,47,167,0.01)] font-light placeholder:text-slate-400 resize-none"
                placeholder="Tell us a bit about yourself..."
              />
            </div>

            {/* Secure Verification Module */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="h-5 w-5 stroke-[1.5] text-slate-800" />
                <h2 className="text-xs uppercase tracking-[0.2em] font-semibold text-slate-850 font-mono">Identity Verification</h2>
              </div>
              {form.idVerified ? (
                <p className="mt-2 text-sm text-slate-600 font-light">✓ Your identity has been successfully verified.</p>
              ) : (
                <>
                  <p className="mt-2 text-xs text-slate-500 font-light leading-relaxed">
                    For safety across our private homes, Walkinlocals completes a quick secure ID check for all members.
                  </p>
                  <button
                    type="button"
                    onClick={startVerification}
                    disabled={verifying}
                    className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#002FA7] px-6 py-3 text-xs font-semibold font-mono uppercase tracking-widest text-white transition-all duration-300 hover:bg-[#001e6c] disabled:opacity-50"
                  >
                    {verifying ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ShieldCheck className="h-3.5 w-3.5" />}
                    {verifying ? "Loading..." : "Verify Identity"}
                  </button>
                </>
              )}
            </div>

            {error && (
              <p className="text-sm text-red-600 font-light" role="alert">
                {error}
              </p>
            )}
            {success && <p className="text-sm text-emerald-600 font-light">{success}</p>}

            <button
              type="submit"
              disabled={saving}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-[#002FA7] px-6 py-4 text-xs font-semibold font-mono uppercase tracking-widest text-white transition-all duration-300 hover:bg-[#001e6c] shadow-md disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin text-white" />}
              {complete ? "Save & Activate Profile" : "Save Draft Details"}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}