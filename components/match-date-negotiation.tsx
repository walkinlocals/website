"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Calendar, Check, Loader2 } from "lucide-react";
import VisitDatePicker from "@/components/visit-date-picker";
import {
  formatVisitDate,
  canRespondToDateProposal,
  guestMustProposeDate,
  isAwaitingDateResponse,
  isDateNegotiationComplete,
  isHostWaitingForGuestDate,
  type MatchDateFields,
} from "@/lib/match-dates";

const CARD_CLASS =
  "w-full min-w-0 space-y-5 rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_4px_15px_rgba(0,47,167,0.01)]";

interface Props {
  match: MatchDateFields & { id: string; status: string };
  currentUserId: string;
  hostId: string;
}

export default function MatchDateNegotiation({ match, currentUserId, hostId }: Props) {
  const router = useRouter();
  const [counterDate, setCounterDate] = useState<string | null>(match.proposed_date);
  const [showCounter, setShowCounter] = useState(false);
  const [working, setWorking] = useState<null | "propose" | "accept">(null);
  const [error, setError] = useState<string | null>(null);

  if (match.status === "Paid" || match.status === "Denied" || isDateNegotiationComplete(match)) {
    if (match.proposed_date && isDateNegotiationComplete(match)) {
      return (
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50/40 px-4 py-3 text-sm text-emerald-900">
          <span className="font-mono text-[9px] uppercase tracking-wider text-emerald-700 font-bold">
            Visit date
          </span>
          <p className="mt-1 font-serif">{formatVisitDate(match.proposed_date)}</p>
        </div>
      );
    }
    return null;
  }

  const mustPropose = guestMustProposeDate(match) && currentUserId === match.guest_id;
  const canRespond = canRespondToDateProposal(match, currentUserId);
  const awaiting = isAwaitingDateResponse(match, currentUserId);
  const hostWaiting = isHostWaitingForGuestDate(match, currentUserId);
  const showRespondActions = canRespond && !!match.proposed_date && !showCounter;
  const showCounterActions = canRespond && showCounter;
  const hasVisibleContent =
    mustPropose || hostWaiting || (awaiting && !!match.proposed_date) || showRespondActions || showCounterActions;

  async function run(action: "propose" | "accept", proposedDate?: string) {
    setWorking(action);
    setError(null);
    try {
      const res = await fetch("/api/matches/date", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matchId: match.id, action, proposedDate }),
      });
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(body.error ?? "Could not update the visit date.");
        return;
      }
      setShowCounter(false);
      router.refresh();
    } finally {
      setWorking(null);
    }
  }

  function handleCalendarChange(date: string) {
    if (canRespond && match.proposed_date && date !== match.proposed_date) {
      setShowCounter(true);
      setCounterDate(date);
      return;
    }
    setCounterDate(date);
  }

  const calendarValue = showCounter ? counterDate : counterDate ?? match.proposed_date;

  return (
    <div className={CARD_CLASS}>
      <div className="flex items-center gap-2">
        <Calendar className="h-4 w-4 text-[#002FA7]" />
        <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#002FA7] font-bold">
          Visit date
        </span>
      </div>

      {mustPropose && (
        <>
          <p className="text-sm font-light leading-relaxed text-slate-600">
            This host invited you to connect. Pick a date you&apos;d like to visit, then send it over.
          </p>
          <VisitDatePicker
            hostId={hostId}
            value={calendarValue}
            onChange={handleCalendarChange}
            disabled={working !== null}
          />
          <button
            type="button"
            disabled={working !== null || !counterDate}
            onClick={() => counterDate && run("propose", counterDate)}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#002FA7] px-6 py-3.5 font-mono text-[9px] font-semibold uppercase tracking-widest text-white shadow-[0_4px_12px_rgba(0,47,167,0.15)] transition hover:bg-[#001e6c] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {working === "propose" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
            {counterDate ? `Propose visit · ${formatVisitDate(counterDate)}` : "Propose this date"}
          </button>
        </>
      )}

      {hostWaiting && (
        <p className="text-sm font-light leading-relaxed text-slate-600">
          You invited this traveler to connect. They&apos;ll pick a visit date from their calendar — you&apos;ll
          get a notification when they do.
        </p>
      )}

      {awaiting && match.proposed_date && (
        <>
          <p className="text-sm font-light text-slate-600">
            You proposed <strong className="text-slate-900">{formatVisitDate(match.proposed_date)}</strong>.
            Waiting for the other person to respond.
          </p>
          <VisitDatePicker
            hostId={hostId}
            value={match.proposed_date}
            onChange={() => undefined}
            disabled
          />
        </>
      )}

      {showRespondActions && (
        <>
          <p className="text-sm font-light leading-relaxed text-slate-600">
            {currentUserId === match.host_id
              ? "This traveler proposed a visit on"
              : "Your host proposed"}{" "}
            <strong className="text-slate-900">{formatVisitDate(match.proposed_date!)}</strong>. Review the
            calendar below, accept it, or tap another day to suggest a different date.
          </p>
          <VisitDatePicker
            hostId={hostId}
            value={match.proposed_date}
            onChange={handleCalendarChange}
            disabled={working !== null}
          />
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={working !== null}
              onClick={() => run("accept")}
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full bg-[#002FA7] px-5 py-3 font-mono text-[9px] font-semibold uppercase tracking-widest text-white shadow-[0_4px_12px_rgba(0,47,167,0.15)] transition hover:bg-[#001e6c] disabled:opacity-50 sm:flex-none"
            >
              {working === "accept" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              Accept this date
            </button>
            <button
              type="button"
              disabled={working !== null}
              onClick={() => {
                setShowCounter(true);
                setCounterDate(null);
              }}
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full border border-slate-200 bg-white px-5 py-3 font-mono text-[9px] font-semibold uppercase tracking-widest text-slate-650 sm:flex-none"
            >
              Pick another day
            </button>
          </div>
        </>
      )}

      {showCounterActions && (
        <>
          <p className="text-sm font-light text-slate-600">Pick a different date to suggest instead.</p>
          <VisitDatePicker
            hostId={hostId}
            value={counterDate}
            onChange={setCounterDate}
            disabled={working !== null}
          />
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={working !== null || !counterDate}
              onClick={() => counterDate && run("propose", counterDate)}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-[#002FA7] px-5 py-3 font-mono text-[9px] font-semibold uppercase tracking-widest text-white disabled:opacity-50 sm:flex-none"
            >
              {working === "propose" ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {counterDate ? `Send · ${formatVisitDate(counterDate)}` : "Send new date"}
            </button>
            <button
              type="button"
              disabled={working !== null}
              onClick={() => {
                setShowCounter(false);
                setCounterDate(match.proposed_date);
              }}
              className="rounded-full border border-slate-200 bg-white px-5 py-3 font-mono text-[9px] font-semibold uppercase tracking-widest text-slate-500"
            >
              Cancel
            </button>
          </div>
        </>
      )}

      {!hasVisibleContent && (
        <p className="text-sm font-light leading-relaxed text-slate-600">
          {currentUserId === match.guest_id
            ? "Pick a visit date below to continue this connection."
            : "Waiting for the traveler to choose a visit date."}
        </p>
      )}

      {!hasVisibleContent && currentUserId === match.guest_id && (
        <>
          <VisitDatePicker
            hostId={hostId}
            value={counterDate}
            onChange={setCounterDate}
            disabled={working !== null}
          />
          <button
            type="button"
            disabled={working !== null || !counterDate}
            onClick={() => counterDate && run("propose", counterDate)}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#002FA7] px-6 py-3.5 font-mono text-[9px] font-semibold uppercase tracking-widest text-white shadow-[0_4px_12px_rgba(0,47,167,0.15)] transition hover:bg-[#001e6c] disabled:opacity-50"
          >
            {working === "propose" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
            {counterDate ? `Propose visit · ${formatVisitDate(counterDate)}` : "Propose this date"}
          </button>
        </>
      )}

      {error && (
        <p className="text-sm text-rose-600 font-light" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
