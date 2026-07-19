import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { BadgeCheck, MapPin, Lock, Phone, Mail, ArrowLeft, Heart } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import ProfileActions from "@/components/profile-actions";
import ReportUserButton from "@/components/report-user-button";
import HostBookingPicker from "@/components/host-booking-picker";
import HostInvitePicker from "@/components/host-invite-picker";
import { resolveViewerCanConnect } from "@/lib/viewer-profile";
import { formatDirectoryLocation } from "@/lib/directory-display";
import { PAGE_BG_DOTS, PAGE_CONTAINER, PAGE_SHELL } from "@/lib/page-layout";

interface TargetProfile {
  id: string;
  full_name: string | null;
  role: "Guest" | "Host" | "Admin" | null;
  neighborhood: string | null;
  origin_location: string | null;
  bio: string | null;
  avatar_url: string | null;
  phone: string | null;
  contact_email: string | null;
  id_verified: boolean | null;
}

export default async function ProfileDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  // 1. Get authenticated user
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // 2. Fetch the target profile and current user's profile in parallel
  const [targetResult, meResult] = await Promise.all([
    supabase
      .from("profiles")
      .select(
        "id, full_name, role, neighborhood, origin_location, bio, avatar_url, phone, contact_email, id_verified",
      )
      .eq("id", id)
      .single(),
    supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single(),
  ]);

  const target = targetResult.data;
  if (!target) notFound();

  const profile = target as TargetProfile;
  const me = meResult.data;
  const viewerActive = await resolveViewerCanConnect(supabase, user.id);

  const myRole = me?.role ?? null;
  const isSelf = user.id === profile.id;
  const viewerIsGuest = myRole === "Guest";
  const viewerIsHost = myRole === "Host";

  const rolesAreOpposite =
    !isSelf &&
    (myRole === "Guest" || myRole === "Host") &&
    (profile.role === "Guest" || profile.role === "Host") &&
    myRole !== profile.role;

  let guestId: string | null = null;
  let hostId: string | null = null;
  if (rolesAreOpposite) {
    if (myRole === "Guest") {
      guestId = user.id;
      hostId = profile.id;
    } else {
      guestId = profile.id;
      hostId = user.id;
    }
  }

  let matchStatus: string | null = null;
  if (guestId && hostId) {
    const { data: m } = await supabase
      .from("matches")
      .select("status")
      .eq("guest_id", guestId)
      .eq("host_id", hostId)
      .maybeSingle();
    matchStatus = m?.status ?? null;
  }

  const contactUnlocked = matchStatus === "Paid" || isSelf;

  const locationLabel =
    profile.role === "Host" || profile.role === "Guest"
      ? formatDirectoryLocation(profile, profile.role)
      : null;

  const backHref = myRole === "Host" ? "/guest-directory" : "/host-directory";

  return (
    <div className={`${PAGE_SHELL} antialiased`}>
      <div className={PAGE_BG_DOTS} />

      <main className={`${PAGE_CONTAINER} py-12 sm:py-16`}>
        {/* Back Link */}
        <Link
          href={backHref}
          className="group inline-flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.25em] text-slate-400 transition-colors duration-300 hover:text-[#002FA7] mb-10"
        >
          <ArrowLeft className="h-3 w-3 transition-transform duration-300 group-hover:-translate-x-0.5" />
          Back to Directory
        </Link>

        {/* MODERN SPLIT LAYOUT */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">

          {/* LEFT SIDEBAR COLUMN: Compact Identity Profile */}
          <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-24">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_4px_15px_rgba(0,47,167,0.01)] text-center lg:text-left">
              {/* Profile Picture Frame */}
              <div className="mx-auto lg:mx-0 h-32 w-32 overflow-hidden rounded-full border border-slate-200 bg-slate-50 shadow-inner">
                {profile.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={profile.avatar_url}
                    alt={profile.full_name ?? "Profile photo"}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-4xl font-light text-slate-400">
                    {profile.full_name?.charAt(0) ?? "?"}
                  </div>
                )}
              </div>

              {/* Title Identity Parameters */}
              <h1 className="mt-5 font-serif text-3xl font-normal tracking-tight text-slate-950 break-words">
                {profile.full_name ?? "Walk In member"}
              </h1>

              {/* Badges Stack */}
              <div className="mt-4 flex flex-wrap justify-center lg:justify-start gap-2">
                {profile.role && (
                  <span className="inline-block px-3 py-1 bg-[#002fa7]/5 text-[#002FA7] font-mono text-[9px] uppercase tracking-wider font-semibold rounded-full">
                    {profile.role}
                  </span>
                )}
                {profile.id_verified && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-slate-150 bg-slate-50 px-3 py-1 font-mono text-[9px] uppercase tracking-wider text-slate-600">
                    <BadgeCheck className="h-3 w-3 text-[#002FA7]" />
                    Verified
                  </span>
                )}
              </div>

              {/* Location Metric Block */}
              {locationLabel && (
                <div className="mt-5 flex items-center justify-center lg:justify-start gap-1.5 text-[10px] font-mono uppercase tracking-wider text-slate-400">
                  <MapPin className="h-4 w-4 text-[#002FA7]/70 shrink-0" />
                  <span>{locationLabel}</span>
                </div>
              )}
            </div>

            {/* Guest: pick a date before requesting */}
            {rolesAreOpposite && matchStatus === null && guestId && hostId && viewerIsGuest && (
              <div className="hidden lg:block">
                <HostBookingPicker
                  hostId={hostId}
                  guestId={guestId}
                  disabled={!viewerActive}
                />
              </div>
            )}

            {rolesAreOpposite && matchStatus === null && guestId && hostId && viewerIsHost && (
              <div className="hidden lg:block">
                <HostInvitePicker
                  guestId={guestId}
                  hostId={hostId}
                  disabled={!viewerActive}
                />
              </div>
            )}
          </div>

          {/* RIGHT CONTENT COLUMN: Narrative & Dynamic Interfaces */}
          <div className="lg:col-span-8 space-y-8">

            {/* Biography Context Wrapper */}
            <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-[0_4px_15px_rgba(0,47,167,0.01)]">
              <div className="flex items-center gap-1.5 border-b border-slate-100 pb-4">
                <Heart className="h-3.5 w-3.5 fill-[#002FA7] text-[#002FA7] animate-pulse" />
                <span className="block font-mono text-[9px] uppercase tracking-[0.3em] text-[#002FA7] font-semibold">
                  The Story
                </span>
              </div>
              <p className="mt-6 font-serif text-lg font-light leading-relaxed text-slate-850 whitespace-pre-line sm:text-xl">
                {profile.bio || "This member hasn't written their story yet."}
              </p>
            </div>

            {/* Verification Metrics / Secured Content */}
            <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-[0_4px_15px_rgba(0,47,167,0.01)]">
              <span className="block font-mono text-[9px] uppercase tracking-[0.3em] text-slate-400 font-semibold border-b border-slate-100 pb-4 mb-6">
                Secured Contact Metrics
              </span>

              {contactUnlocked ? (
                <div className="space-y-4">
                  <div className="grid gap-3 sm:grid-cols-2 font-mono text-xs text-slate-600">
                    <div className="flex items-center gap-2 rounded-xl bg-slate-50/70 px-3 py-2.5 border border-slate-100">
                      <Mail className="h-4 w-4 text-[#002FA7] shrink-0" />
                      <span className="text-slate-400 font-medium">Mail:</span>
                      <span className="text-slate-800 break-all">{profile.contact_email || "—"}</span>
                    </div>
                    <div className="flex items-center gap-2 rounded-xl bg-slate-50/70 px-3 py-2.5 border border-slate-100">
                      <Phone className="h-4 w-4 text-[#002FA7] shrink-0" />
                      <span className="text-slate-400 font-medium">Phone:</span>
                      <span className="text-slate-800 tracking-wider">{profile.phone || "—"}</span>
                    </div>
                  </div>

                  {/* Clean, Premium WhatsApp Alignment Handshake Button */}
                  {profile.phone && (
                    <div className="pt-2 flex justify-start">
                      <a
                        href={`https://wa.me/${profile.phone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(
                          `Hi ${profile.full_name || "there"}! I am contacting you from WalkIn Locals to coordinate our visit details. Looking forward to chatting! ✦`
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full bg-[#002FA7] text-white px-5 py-3 font-mono text-[9px] uppercase font-semibold tracking-widest transition-all duration-300 hover:bg-[#001e6c] hover:scale-[1.01] shadow-[0_4px_12px_rgba(0,47,167,0.12)] group"
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 group-hover:scale-110 transition-transform shrink-0" />
                        <span>Open Chat on WhatsApp</span>
                      </a>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-start gap-4 rounded-2xl border border-slate-100 bg-slate-50/50 p-5">
                  <Lock className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#002FA7]" />
                  <div className="space-y-1">
                    <p className="font-serif text-sm font-medium text-slate-950">
                      Contact details are currently locked
                    </p>
                    <p className="text-xs font-light leading-relaxed text-slate-500 max-w-xl">
                      Direct metrics (phone and email) become visible automatically only after a host accepts your visit request and the corresponding connection setup is completed.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons Interface Block / Mobile Responsive Picker */}
            <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-[0_4px_15px_rgba(0,47,167,0.01)]">
              {rolesAreOpposite && matchStatus === null && guestId && hostId && viewerIsGuest && (
                <div className="block lg:hidden mb-2">
                  <HostBookingPicker
                    hostId={hostId}
                    guestId={guestId}
                    disabled={!viewerActive}
                  />
                </div>
              )}

              {rolesAreOpposite && matchStatus === null && guestId && hostId && viewerIsHost && (
                <div className="block lg:hidden mb-2">
                  <HostInvitePicker
                    guestId={guestId}
                    hostId={hostId}
                    disabled={!viewerActive}
                  />
                </div>
              )}

              {!(rolesAreOpposite && matchStatus === null && (viewerIsGuest || viewerIsHost)) && (
                <ProfileActions
                  isSelf={isSelf}
                  canConnect={rolesAreOpposite}
                  viewerActive={viewerActive}
                  guestId={guestId}
                  hostId={hostId}
                  matchStatus={matchStatus}
                  viewerRole={myRole === "Host" || myRole === "Guest" ? myRole : null}
                />
              )}

              {rolesAreOpposite && matchStatus === null && guestId && hostId && viewerIsGuest && (
                <p className="hidden lg:block mt-4 text-slate-500 text-xs font-mono font-light uppercase tracking-wider">
                  ← Choose a date in the sidebar, then send your request.
                </p>
              )}

              {rolesAreOpposite && matchStatus === null && guestId && hostId && viewerIsHost && (
                <p className="hidden lg:block mt-4 text-slate-500 text-xs font-mono font-light uppercase tracking-wider">
                  ← Send an invitation from the sidebar — they&apos;ll pick a visit date.
                </p>
              )}

              {!isSelf && (
                <div className="mt-6 border-t border-slate-100 pt-6">
                  <ReportUserButton
                    reportedUserId={profile.id}
                    reportedName={profile.full_name ?? "this member"}
                  />
                </div>
              )}
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}