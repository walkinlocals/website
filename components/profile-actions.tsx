"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, Check, Clock, Heart, Info, ArrowRight, UserPlus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface Props {
  isSelf: boolean;
  canConnect: boolean;
  viewerActive: boolean;
  guestId: string | null;
  hostId: string | null;
  matchStatus: string | null;
  viewerRole?: "Guest" | "Host" | null;
}

type State =
  | { s: "idle" }
  | { s: "working" }
  | { s: "sent" }
  | { s: "error"; message: string };

export default function ProfileActions({
  isSelf,
  canConnect,
  viewerActive,
  guestId,
  hostId,
  matchStatus,
  viewerRole,
}: Props) {
  const supabase = createClient();
  const router = useRouter();
  const [state, setState] = useState<State>({ s: "idle" });
  const partySize = 1;
  const [viewerId, setViewerId] = useState<string | null>(null);

  useEffect(() => {
    async function getViewer() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setViewerId(user.id);
    }
    getViewer();
  }, [supabase]);

  // SELF PROFILE ACTION
  if (isSelf) {
    return (
      <Link
        href="/profile"
        className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-3 font-mono text-[9px] uppercase font-semibold tracking-widest text-slate-700 transition-all duration-300 hover:bg-slate-50 hover:border-slate-300 shadow-sm"
      >
        <span>Edit your profile</span>
      </Link>
    );
  }

  // INVALID ROLE COMBINATION
  if (!canConnect) {
    return (
      <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4">
        <p className="font-serif text-xs italic text-slate-400 font-light leading-relaxed">
          Connections are exclusive structural arrangements engineered between verified sightseers and local hosts.
        </p>
      </div>
    );
  }

  // PROFILE INCOMPLETE GUARD
  if (!viewerActive) {
    return (
      <div className="w-full space-y-3">
        <p className="font-serif text-xs italic text-slate-400 font-light leading-relaxed">
          Your profile must be completed and active before initiating outside connections.
        </p>
        <Link
          href="/profile"
          className="inline-flex items-center justify-center gap-2 rounded-full bg-[#002FA7] px-6 py-3.5 font-mono text-[9px] uppercase font-semibold tracking-widest text-white transition-all duration-300 hover:bg-[#001e6c] shadow-[0_4px_12px_rgba(0,47,167,0.15)] hover:scale-[1.01]"
        >
          <UserPlus className="h-3.5 w-3.5" />
          Complete your profile to connect
        </Link>
      </div>
    );
  }

  // CONNECTION ALREADY EXISTS STATE
  const existing = matchStatus ?? (state.s === "sent" ? "Pending" : null);
  if (existing) {
    const label: Record<string, string> = {
      Pending: "Requested — Awaiting Response",
      Hold: "On Hold by Host",
      Accepted: "Accepted — Pending Checkout",
      Denied: "Declined",
      Paid: "Connected & Verified",
    };

    const tone =
      existing === "Paid"
        ? "border-emerald-200 bg-emerald-50/40 text-emerald-800"
        : existing === "Denied"
          ? "border-rose-200 bg-rose-50/40 text-rose-700"
          : "border-slate-200 bg-slate-50 text-slate-600";

    return (
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 w-full rounded-2xl border border-slate-100 p-4 bg-slate-50/30">
        <div className="flex items-center gap-3">
          <span className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 font-mono text-[9px] uppercase font-semibold tracking-wider ${tone}`}>
            {existing === "Paid" ? (
              <Check className="h-3 w-3 text-emerald-600 stroke-[3]" />
            ) : (
              <Clock className="h-3 w-3 animate-pulse text-slate-400" />
            )}
            {label[existing] ?? existing}
          </span>
        </div>
        <Link
          href="/matches"
          className="group inline-flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-widest text-[#002FA7] font-bold transition-all duration-300 hover:text-[#001e6c]"
        >
          <span>Go to Matches</span>
          <ArrowRight className="h-3 w-3 transition-transform duration-300 group-hover:translate-x-0.5" />
        </Link>
      </div>
    );
  }

  async function requestConnection() {
    setState({ s: "working" });
    const res = await fetch("/api/matches/request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ guestId, hostId, partySize }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      if (res.status === 409) {
        setState({ s: "sent" });
        router.refresh();
        return;
      }
      setState({ s: "error", message: data.error || "Could not send request." });
      return;
    }
    setState({ s: "sent" });
    router.refresh();
  }

  const viewerIsGuest = viewerRole === "Guest" || viewerId === guestId;
  const viewerIsHost = viewerRole === "Host" || viewerId === hostId;

  // Guests request via the calendar on the host profile — not here.
  if (viewerIsGuest && !existing) {
    return (
      <p className="font-serif text-xs italic font-light leading-relaxed text-slate-400">
        Use the calendar on a host&apos;s profile to pick a date and send a visit request.
      </p>
    );
  }

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end justify-between w-full">
        {viewerIsHost ? (
          <div className="space-y-3 flex-1 max-w-md">
            <span className="block font-mono text-[9px] uppercase tracking-[0.15em] text-slate-400 font-bold">
              Invite this sightseer
            </span>
            <div className="flex items-start gap-2.5 rounded-xl bg-slate-50/70 p-3.5 border border-slate-100 text-xs text-slate-500 font-light leading-relaxed">
              <Info className="h-4 w-4 shrink-0 text-[#002FA7] mt-0.5" />
              <p>
                Send an invitation without a date. They&apos;ll propose a visit day, then you can agree or suggest another.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3 flex-1 max-w-md">
            <span className="block font-mono text-[9px] uppercase tracking-[0.15em] text-slate-400 font-bold">
              Connection Request
            </span>
            <div className="flex items-start gap-2.5 rounded-xl bg-slate-50/70 p-3.5 border border-slate-100 text-xs text-slate-500 font-light leading-relaxed">
              <Info className="h-4 w-4 shrink-0 text-[#002FA7] mt-0.5" />
              <p>
                Reaching out will prompt this sightseer to confirm party size and complete payment when they accept.
              </p>
            </div>
          </div>
        )}

        {/* CONNECT INTERFACE TRIGGER BUTTON */}
        <div className="pt-2 lg:pt-0">
          <button
            type="button"
            onClick={requestConnection}
            disabled={state.s === "working"}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full bg-[#002FA7] px-6 py-3.5 font-mono text-[9px] uppercase font-semibold tracking-widest text-white transition-all duration-300 hover:bg-[#001e6c] hover:scale-[1.01] shadow-[0_4px_12px_rgba(0,47,167,0.15)] disabled:cursor-not-allowed disabled:opacity-50 whitespace-nowrap group"
          >
            {state.s === "working" ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-white" />
            ) : (
              <Heart className="h-3.5 w-3.5 transition-transform duration-300 group-hover:scale-110 text-white" />
            )}
            <span>{state.s === "working" ? "Sending Request..." : "Invite to connect"}</span>
          </button>
        </div>
      </div>

      {/* ERROR FEEDBACK ROW */}
      {state.s === "error" && (
        <div className="rounded-xl border border-rose-100 bg-rose-50/30 p-3">
          <p className="font-mono text-[9px] uppercase tracking-wider text-rose-600 font-bold" role="alert">
            Error: {state.message}
          </p>
        </div>
      )}
    </div>
  );
}