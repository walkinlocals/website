import { notFound, redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { BadgeCheck, MapPin, Lock, Phone, Mail, MessageCircle, ArrowLeft, Heart } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import ProfileActions from "@/components/profile-actions";
import ReportUserButton from "@/components/report-user-button";
import HostBookingPicker from "@/components/host-booking-picker";
import HostInvitePicker from "@/components/host-invite-picker";
import WhatsAppButton from "@/components/whatsapp-button";
import { resolveViewerCanConnect } from "@/lib/viewer-profile";
import { formatDirectoryLocation } from "@/lib/directory-display";
import { PAGE_MAIN, PAGE_SHELL } from "@/lib/page-layout";

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
    <div className={`${PAGE_SHELL} font-sans text-slate-950 antialiased`}>

      <main className={PAGE_MAIN}>
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
            <div className="border-b border-slate-200/80 pb-8 text-center lg:border-b-0 lg:pb-0 lg:text-left">
              {/* Profile Picture Frame */}
              <div className="relative mx-auto lg:mx-0 h-32 w-32 overflow-hidden rounded-full border border-slate-200 bg-slate-50 shadow-lg shadow-slate-900/10">
                {profile.avatar_url ? (
                  <Image
                    src={profile.avatar_url}
                    alt={profile.full_name ?? "Profile photo"}
                    fill
                    sizes="128px"
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-4xl font-light text-slate-400">
                    {profile.full_name?.charAt(0) ?? "?"}
                  </div>
                )}
              </div>

              {/* Title Identity Parameters */}
              <h1 className="mt-5 font-sans text-2xl font-bold tracking-tight text-slate-950 break-words sm:text-[1.875rem]">
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
            <div className="rounded-2xl border border-slate-200/80 p-6 shadow-sm sm:p-8">
              <div className="flex items-center gap-1.5 pb-4">
                <Heart className="h-3.5 w-3.5 fill-[#002FA7] text-[#002FA7]" />
                <span className="font-sans text-[11px] font-semibold uppercase tracking-[0.22em] text-[#002FA7]">
                  The Story
                </span>
              </div>
              <p className="text-base leading-relaxed text-slate-950 whitespace-pre-line break-words [overflow-wrap:anywhere] sm:text-[17px] sm:leading-[1.65]">
                {profile.bio || "This member hasn't written their story yet."}
              </p>
            </div>

            {/* Verification Metrics / Secured Content */}
            <div className="rounded-2xl border border-slate-200/80 p-6 shadow-sm sm:p-8">
              <span className="block font-sans text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500 pb-4">
                Contact
              </span>

              {contactUnlocked ? (
                <div className="space-y-4">
                  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 text-sm text-slate-700">
                    <div className="flex items-start gap-2">
                      <Mail className="h-4 w-4 text-[#002FA7] shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <span className="text-slate-500">Email</span>
                        <p className="mt-0.5 text-slate-950 break-all">{profile.contact_email || "—"}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Phone className="h-4 w-4 text-[#002FA7] shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <span className="text-slate-500">Phone</span>
                        <p className="mt-0.5 text-slate-950 tracking-wide">{profile.phone || "—"}</p>
                      </div>
                    </div>
                    {profile.phone ? (
                      <div className="flex items-start gap-2">
                        <MessageCircle className="h-4 w-4 text-[#002FA7] shrink-0 mt-0.5" />
                        <div className="min-w-0">
                          <span className="text-slate-500">WhatsApp</span>
                          <div className="mt-1">
                            <WhatsAppButton
                              phone={profile.phone}
                              message={`Hi ${profile.full_name || "there"}! I am contacting you from WALKINLOCALS to coordinate our visit details. Looking forward to chatting! ✦`}
                              className="h-9 w-9"
                            />
                          </div>
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-4">
                  <Lock className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#002FA7]" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-slate-950">
                      Contact details are currently locked
                    </p>
                    <p className="text-sm leading-relaxed text-slate-600 max-w-xl">
                      Phone and email appear after a host accepts your visit request and the connection is set up.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons Interface Block / Mobile Responsive Picker */}
            <div className="pt-2">
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