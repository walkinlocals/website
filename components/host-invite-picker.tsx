"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Heart, Info, Loader2 } from "lucide-react";

interface Props {
  guestId: string;
  hostId: string;
  disabled?: boolean;
}

export default function HostInvitePicker({ guestId, hostId, disabled }: Props) {
  const router = useRouter();
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function sendInvite() {
    setWorking(true);
    setError(null);
    try {
      const res = await fetch("/api/matches/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guestId, hostId, partySize: 1 }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        if (res.status === 409) {
          setSent(true);
          router.refresh();
          return;
        }
        setError(data.error ?? "Could not send invitation.");
        return;
      }
      setSent(true);
      router.refresh();
    } finally {
      setWorking(false);
    }
  }

  if (disabled) {
    return (
      <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4">
        <p className="font-serif text-xs italic font-light leading-relaxed text-slate-400">
          Complete and activate your profile before inviting travelers.
        </p>
      </div>
    );
  }

  if (sent) {
    return (
      <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4">
        <p className="font-mono text-[9px] uppercase tracking-wider font-semibold text-emerald-800">
          Invitation sent
        </p>
        <p className="mt-2 text-sm font-light text-emerald-900/80">
          They&apos;ll pick a visit date on Matches — you&apos;ll get a notification when they do.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5 rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_4px_15px_rgba(0,47,167,0.01)]">
      <div className="space-y-2">
        <span className="block font-mono text-[9px] uppercase tracking-[0.15em] text-slate-400 font-bold">
          Invite this traveler
        </span>
        <div className="flex items-start gap-2 rounded-xl border border-slate-100 bg-slate-50/70 p-3 text-xs font-light leading-relaxed text-slate-500">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-[#002FA7]" />
          <p>
            Send an invitation without a date. They&apos;ll propose a visit day on their calendar, then you can
            accept or suggest another.
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={sendInvite}
        disabled={working}
        className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#002FA7] px-6 py-3.5 font-mono text-[9px] font-semibold uppercase tracking-widest text-white shadow-[0_4px_12px_rgba(0,47,167,0.15)] transition hover:bg-[#001e6c] hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {working ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Heart className="h-3.5 w-3.5" />}
        {working ? "Sending…" : "Invite to connect"}
      </button>

      {error && (
        <p className="font-mono text-[9px] uppercase tracking-wider text-rose-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
