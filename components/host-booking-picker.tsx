"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Heart, Info, Loader2 } from "lucide-react";
import VisitDatePicker from "@/components/visit-date-picker";
import { MAX_PARTY_SIZE } from "@/lib/pricing";
import { formatVisitDate } from "@/lib/match-dates";

interface Props {
  hostId: string;
  guestId: string;
  disabled?: boolean;
}

export default function HostBookingPicker({ hostId, guestId, disabled }: Props) {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [partySize, setPartySize] = useState(1);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function requestVisit() {
    if (!selectedDate) {
      setError("Choose a visit date first.");
      return;
    }
    setWorking(true);
    setError(null);
    try {
      const res = await fetch("/api/matches/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guestId, hostId, partySize, proposedDate: selectedDate }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Could not send request.");
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
          Complete and activate your profile before requesting a visit.
        </p>
      </div>
    );
  }

  if (sent) {
    return (
      <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4">
        <p className="font-mono text-[9px] uppercase tracking-wider font-semibold text-emerald-800">
          Request sent
        </p>
        <p className="mt-2 text-sm font-light text-emerald-900/80">
          {selectedDate ? formatVisitDate(selectedDate) : "Your date"} — awaiting the host&apos;s response on Matches.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5 rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_4px_15px_rgba(0,47,167,0.01)]">
      <VisitDatePicker hostId={hostId} value={selectedDate} onChange={setSelectedDate} disabled={working} />

      <div className="space-y-2">
        <label htmlFor="guest-party" className="block font-mono text-[9px] uppercase tracking-[0.15em] text-slate-400 font-bold">
          Party size
        </label>
        <div className="flex items-start gap-2 rounded-xl border border-slate-100 bg-slate-50/70 p-3 text-xs font-light leading-relaxed text-slate-500">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-[#002FA7]" />
          <p>
            <strong className="font-semibold text-slate-800">€35 per person</strong> unlocks contact details. Hosts receive €25 per person.
          </p>
        </div>
        <select
          id="guest-party"
          value={partySize}
          onChange={(e) => setPartySize(Number(e.target.value))}
          disabled={working}
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-light text-slate-950 shadow-sm transition focus:border-[#002FA7] focus:outline-none focus:ring-1 focus:ring-[#002FA7]"
        >
          {Array.from({ length: MAX_PARTY_SIZE }, (_, i) => i + 1).map((n) => (
            <option key={n} value={n}>
              {n} {n === 1 ? "person" : "people"} — €{n * 35}
            </option>
          ))}
        </select>
      </div>

      <button
        type="button"
        onClick={requestVisit}
        disabled={working || !selectedDate}
        className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#002FA7] px-6 py-3.5 font-mono text-[9px] font-semibold uppercase tracking-widest text-white shadow-[0_4px_12px_rgba(0,47,167,0.15)] transition hover:bg-[#001e6c] hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {working ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Heart className="h-3.5 w-3.5" />}
        {working ? "Sending…" : selectedDate ? `Request visit · ${formatVisitDate(selectedDate)}` : "Request visit"}
      </button>

      {error && (
        <p className="font-mono text-[9px] uppercase tracking-wider text-rose-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
