"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, Check, HeartHandshake, Clock, Heart } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface Props {
  isSelf: boolean;
  canConnect: boolean;
  viewerActive: boolean;
  guestId: string | null;
  hostId: string | null;
  matchStatus: string | null;
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
}: Props) {
  const supabase = createClient();
  const router = useRouter();
  const [state, setState] = useState<State>({ s: "idle" });
  const [partySize, setPartySize] = useState(1);
  const [viewerId, setViewerId] = useState<string | null>(null);

  useEffect(() => {
    async function getViewer() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setViewerId(user.id);
    }
    getViewer();
  }, [supabase]);

  if (isSelf) {
    return (
      <Link
        href="/profile"
        className="inline-flex rounded-full border border-slate-200 px-6 py-3 text-xs font-mono font-semibold uppercase tracking-widest text-slate-700 transition-all duration-300 hover:bg-slate-50"
      >
        Edit your profile
      </Link>
    );
  }

  if (!canConnect) {
    return (
      <p className="font-serif text-sm italic text-slate-400 font-light">
        Connections are made between backpackers and hosts.
      </p>
    );
  }

  if (!viewerActive) {
    return (
      <Link
        href="/profile"
        className="inline-flex rounded-full bg-[#002FA7] px-6 py-3.5 text-xs font-mono font-semibold uppercase tracking-widest text-white transition-all duration-300 hover:bg-[#001e6c] shadow-[0_4px_15px_rgba(0,47,167,0.18)]"
      >
        Complete your profile to connect
      </Link>
    );
  }

  const existing = matchStatus ?? (state.s === "sent" ? "Pending" : null);
  if (existing) {
    const label: Record<string, string> = {
      Pending: "Requested — awaiting response",
      Hold: "On hold by host",
      Accepted: "Accepted — see Matches",
      Denied: "Declined",
      Paid: "Connected",
    };
    const tone =
      existing === "Paid"
        ? "border-emerald-100 bg-emerald-50/50 text-emerald-800"
        : existing === "Denied"
          ? "border-rose-100 bg-rose-50/50 text-rose-700"
          : "border-slate-200 bg-slate-50 text-slate-600";
    return (
      <div className="flex flex-wrap items-center gap-4">
        <span className={`inline-flex items-center gap-2 rounded-full border px-5 py-2.5 font-mono text-[10px] uppercase tracking-wider ${tone}`}>
          {existing === "Paid" ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Clock className="h-3.5 w-3.5" />}
          {label[existing] ?? existing}
        </span>
        <Link
          href="/matches"
          className="font-mono text-[10px] uppercase tracking-widest text-[#002FA7] font-semibold transition-colors duration-300 hover:text-slate-950"
        >
          Go to Matches →
        </Link>
      </div>
    );
  }

  async function requestConnection() {
    setState({ s: "working" });
    const { error } = await supabase.from("matches").insert({
      guest_id: guestId,
      host_id: hostId,
      status: "Pending",
      party_size: partySize,
      initiator_id: viewerId,
    });
    if (error) {
      setState(error.code === "23505" ? { s: "sent" } : { s: "error", message: error.message });
      if (error.code === "23505") router.refresh();
      return;
    }
    setState({ s: "sent" });
    router.refresh();
  }

  const viewerIsGuest = viewerId === guestId;

  return (
    <div className="flex flex-col gap-6 sm:flex-row sm:items-end justify-between w-full">
      {viewerIsGuest ? (
        <div className="space-y-2 flex-1 max-w-xs">
          <label htmlFor="party" className="block font-mono text-[10px] uppercase tracking-wider text-slate-400">
            Confirm Party Size
          </label>
          <select
            id="party"
            value={partySize}
            onChange={(e) => setPartySize(Number(e.target.value))}
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 focus:border-[#002FA7] focus:outline-none focus:ring-1 focus:ring-[#002FA7] transition-all duration-300 font-light"
          >
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>
                {n} {n === 1 ? "person" : "people"} — €{n * 35}
              </option>
            ))}
          </select>
        </div>
      ) : (
        <div className="flex-1 max-w-sm">
          <p className="font-serif text-sm italic text-slate-500 leading-relaxed font-light">
            Reaching out will prompt this guest to specify their party size parameters and finalize their connection data later.
          </p>
        </div>
      )}

      <div>
        <button
          type="button"
          onClick={requestConnection}
          disabled={state.s === "working"}
          className="inline-flex items-center gap-2 rounded-full bg-[#002FA7] px-6 py-4 text-xs font-mono font-semibold uppercase tracking-widest text-white transition-all duration-300 hover:bg-[#001e6c] hover:scale-[1.01] shadow-[0_4px_15px_rgba(0,47,167,0.18)] disabled:cursor-not-allowed disabled:opacity-60 whitespace-nowrap"
        >
          {state.s === "working" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Heart className="h-3.5 w-3.5 fill-white" />}
          {state.s === "working" ? "Sending…" : "Request a Connection"}
        </button>
      </div>

      {state.s === "error" && (
        <p className="w-full font-mono text-[10px] uppercase tracking-wider text-rose-600 font-semibold" role="alert">
          {state.message}
        </p>
      )}
    </div>
  );
}