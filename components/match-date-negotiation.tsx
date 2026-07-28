"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Calendar, Check, Loader2 } from "lucide-react";
import VisitDatePicker from "@/components/visit-date-picker";
import {
  formatVisitDateTime,
  canRespondToDateProposal,
  guestMustProposeDate,
  isAwaitingDateResponse,
  isDateNegotiationComplete,
  isHostWaitingForGuestDate,
  type MatchDateFields,
} from "@/lib/match-dates";

const CARD_CLASS =
  "w-full min-w-0 space-y-5 border-t border-slate-200/80 pt-6";

interface Props {
  match: MatchDateFields & { id: string; status: string };
  currentUserId: string;
  hostId: string;
}

export default function MatchDateNegotiation({ match, currentUserId, hostId }: Props) {
  const router = useRouter();
  const [counterDate, setCounterDate] = useState<string | null>(match.proposed_date);
  const [counterTime, setCounterTime] = useState<string | null>(match.proposed_time);
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
          <p className="mt-1 font-serif">
            {formatVisitDateTime(match.proposed_date, match.proposed_time)}
          </p>
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

  const proposeReady = Boolean(counterDate && counterTime);

  async function run(action: "propose" | "accept", proposedDate?: string, proposedTime?: string) {
    setWorking(action);
    setError(null);
    try {
      const res = await fetch("/api/matches/date", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          matchId: match.id,
          action,
          proposedDate,
          proposedTime,
        }),
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
      setCounterTime(null);
      return;
    }
    setCounterDate(date);
    setCounterTime(null);
  }

  const calendarDate = showCounter ? counterDate : counterDate ?? match.proposed_date;
  const calendarTime = showCounter
    ? counterTime
    : counterTime ?? match.proposed_time;

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
            This host invited you to connect. Pick a date and time for your visit, then send it over.
          </p>
          <VisitDatePicker
            hostId={hostId}
            value={calendarDate}
            timeValue={counterTime}
            onChange={handleCalendarChange}
            onTimeChange={setCounterTime}
            disabled={working !== null}
          />
          <button
            type="button"
            disabled={working !== null || !proposeReady}
            onClick={() => counterDate && counterTime && run("propose", counterDate, counterTime)}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#002FA7] px-6 py-3.5 font-mono text-[9px] font-semibold uppercase tracking-widest text-white shadow-[0_4px_12px_rgba(0,47,167,0.15)] transition hover:bg-[#001e6c] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {working === "propose" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
            {proposeReady
              ? `Propose visit · ${formatVisitDateTime(counterDate!, counterTime!)}`
              : "Propose this visit"}
          </button>
        </>
      )}

      {hostWaiting && (
        <p className="text-sm font-light leading-relaxed text-slate-600">
          You invited this backpacker to connect. They&apos;ll pick a date and time from their calendar — you&apos;ll
          get a notification when they do.
        </p>
      )}

      {awaiting && match.proposed_date && (
        <>
          <p className="text-sm font-light text-slate-600">
            You proposed{" "}
            <strong className="text-slate-900">
              {formatVisitDateTime(match.proposed_date, match.proposed_time)}
            </strong>
            . Waiting for the other person to respond.
          </p>
          <VisitDatePicker
            hostId={hostId}
            value={match.proposed_date}
            timeValue={match.proposed_time}
            onChange={() => undefined}
            onTimeChange={() => undefined}
            disabled
          />
        </>
      )}

      {showRespondActions && (
        <>
          <p className="text-sm font-light leading-relaxed text-slate-600">
            {currentUserId === match.host_id
              ? "This backpacker proposed a visit on"
              : "Your host proposed"}{" "}
            <strong className="text-slate-900">
              {formatVisitDateTime(match.proposed_date!, match.proposed_time)}
            </strong>
            . Review below, accept it, or pick another slot.
          </p>
          <VisitDatePicker
            hostId={hostId}
            value={match.proposed_date}
            timeValue={match.proposed_time}
            onChange={handleCalendarChange}
            onTimeChange={(time) => {
              setShowCounter(true);
              setCounterDate(match.proposed_date);
              setCounterTime(time);
            }}
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
              Accept this slot
            </button>
            <button
              type="button"
              disabled={working !== null}
              onClick={() => {
                setShowCounter(true);
                setCounterDate(null);
                setCounterTime(null);
              }}
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full border border-slate-200 bg-white px-5 py-3 font-mono text-[9px] font-semibold uppercase tracking-widest text-slate-650 sm:flex-none"
            >
              Pick another slot
            </button>
          </div>
        </>
      )}

      {showCounterActions && (
        <>
          <p className="text-sm font-light text-slate-600">Pick a different date and time to suggest instead.</p>
          <VisitDatePicker
            hostId={hostId}
            value={counterDate}
            timeValue={counterTime}
            onChange={setCounterDate}
            onTimeChange={setCounterTime}
            disabled={working !== null}
          />
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={working !== null || !proposeReady}
              onClick={() => counterDate && counterTime && run("propose", counterDate, counterTime)}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-[#002FA7] px-5 py-3 font-mono text-[9px] font-semibold uppercase tracking-widest text-white disabled:opacity-50 sm:flex-none"
            >
              {working === "propose" ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {proposeReady
                ? `Send · ${formatVisitDateTime(counterDate!, counterTime!)}`
                : "Send new slot"}
            </button>
            <button
              type="button"
              disabled={working !== null}
              onClick={() => {
                setShowCounter(false);
                setCounterDate(match.proposed_date);
                setCounterTime(match.proposed_time);
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
            ? "Pick a visit date and time below to continue this connection."
            : "Waiting for the backpacker to choose a visit slot."}
        </p>
      )}

      {!hasVisibleContent && currentUserId === match.guest_id && (
        <>
          <VisitDatePicker
            hostId={hostId}
            value={counterDate}
            timeValue={counterTime}
            onChange={setCounterDate}
            onTimeChange={setCounterTime}
            disabled={working !== null}
          />
          <button
            type="button"
            disabled={working !== null || !proposeReady}
            onClick={() => counterDate && counterTime && run("propose", counterDate, counterTime)}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#002FA7] px-6 py-3.5 font-mono text-[9px] font-semibold uppercase tracking-widest text-white shadow-[0_4px_12px_rgba(0,47,167,0.15)] transition hover:bg-[#001e6c] disabled:opacity-50"
          >
            {working === "propose" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
            {proposeReady
              ? `Propose visit · ${formatVisitDateTime(counterDate!, counterTime!)}`
              : "Propose this visit"}
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
