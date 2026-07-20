"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Loader2,
  Check,
  Clock,
  X,
  Phone,
  Mail,
  MapPin,
  PartyPopper,
  Info,
} from "lucide-react";
import { MAX_PARTY_SIZE, HOST_PAYOUT_EUR } from "@/lib/pricing";
import { PAGE_CONTAINER } from "@/lib/page-layout";
import { formatDirectoryLocation } from "@/lib/directory-display";
import ChatBox from "@/components/chat-box";
import LocationMap from "@/components/location-map";
import MatchDateNegotiation from "@/components/match-date-negotiation";
import WhatsAppButton from "@/components/whatsapp-button";
import { isDateNegotiationComplete } from "@/lib/match-dates";

const FEE_PER_PERSON = 35;

type Status = "Pending" | "Hold" | "Accepted" | "Denied" | "Paid";

interface PartyProfile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  neighborhood: string | null;
  origin_location: string | null;
  phone: string | null;
  contact_email: string | null;
}

export interface MatchRow {
  id: string;
  guest_id: string;
  host_id: string;
  status: Status;
  stripe_link: string | null;
  party_size: number;
  initiator_id: string | null;
  created_at: string;
  proposed_date: string | null;
  proposed_time: string | null;
  date_proposed_by: string | null;
  date_confirmed: boolean | null;
  host: PartyProfile | null;
  guest: PartyProfile | null;
}

interface Props {
  currentUserId: string;
  myRole: "Guest" | "Host";
  matches: MatchRow[];
  loadError: string | null;
  justPaid: boolean;
  connectComplete?: boolean;
}

const STATUS_STYLE: Record<Status, string> = {
  Pending: "bg-amber-50 text-amber-800 border border-amber-100",
  Hold: "bg-sky-50 text-sky-700 border border-sky-100",
  Accepted: "bg-blue-50 text-[#002FA7] border border-blue-100",
  Denied: "bg-rose-50 text-rose-600 border border-rose-100",
  Paid: "bg-emerald-50 text-emerald-800 border border-emerald-100",
};

export default function MatchesView({
  currentUserId,
  myRole,
  matches,
  loadError,
  justPaid,
  connectComplete = false,
}: Props) {
  const router = useRouter();
  const [payoutsReady, setPayoutsReady] = useState(false);

  useEffect(() => {
    if (!connectComplete) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/stripe/connect/sync-status", { method: "POST" });
        const data = (await res.json().catch(() => ({}))) as { payouts_enabled?: boolean };
        if (!cancelled && res.ok && data.payouts_enabled) {
          setPayoutsReady(true);
        }
      } finally {
        if (!cancelled) router.replace("/matches");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [connectComplete, router]);

  return (
    <main className={`${PAGE_CONTAINER} py-14 text-slate-900 sm:py-20`}>
      <span className="inline-flex items-center gap-1 font-mono text-[9px] uppercase tracking-[0.3em] text-[#002FA7] font-semibold bg-[#002fa7]/5 px-3 py-1 rounded-full mb-4">
        ✦ Connections Panel ✦
      </span>
      <h1 className="font-serif text-3xl font-normal tracking-tight text-slate-950 sm:text-4xl">Your matches</h1>
      <p className="mt-2 text-sm text-slate-500 font-light leading-relaxed">
        Manage connection requests, respond to invitations, and unlock contact details after payment.
      </p>

      {payoutsReady && (
        <div className="mt-8 flex items-center gap-2.5 rounded-3xl border border-emerald-100 bg-emerald-50/50 px-5 py-4 text-sm text-emerald-800 font-light leading-relaxed">
          <Check className="h-5 w-5 text-emerald-600" />
          <span>Bank details saved — tap <strong>Accept</strong> on your pending visit to confirm it.</span>
        </div>
      )}

      {justPaid && (
        <div className="mt-8 flex items-center gap-2.5 rounded-3xl border border-emerald-100 bg-emerald-50/50 px-5 py-4 text-sm text-emerald-800 font-light leading-relaxed">
          <PartyPopper className="h-5 w-5 text-emerald-600" />
          <span>Payment received — your connection is unlocked below.</span>
        </div>
      )}

      {loadError && (
        <p className="mt-6 text-sm text-rose-600 font-light" role="alert">
          Could not load your matches: {loadError}
        </p>
      )}

      <div className="mt-8 space-y-6">
        {matches.length === 0 && !loadError && (
          <p className="text-sm text-slate-400 font-light italic">You don&apos;t have any matches yet.</p>
        )}
        {matches.map((m) => (
          <MatchCard key={m.id} match={m} currentUserId={currentUserId} myRole={myRole} />
        ))}
      </div>
    </main>
  );
}

function MatchCard({
  match,
  currentUserId,
  myRole,
}: {
  match: MatchRow;
  currentUserId: string;
  myRole: "Guest" | "Host";
}) {
  const router = useRouter();
  const [working, setWorking] = useState<null | "accept" | "hold" | "decline" | "payout">(null);
  const [error, setError] = useState<string | null>(null);
  const [payoutPromptEur, setPayoutPromptEur] = useState<number | null>(null);
  const [selectedPartySize, setSelectedPartySize] = useState(match.party_size ?? 1);

  const iAmHost = match.host_id === currentUserId;
  const other = iAmHost ? match.guest : match.host;
  const otherRole = iAmHost ? "Guest" : "Host";
  const otherLocation =
    other && (otherRole === "Host" || otherRole === "Guest")
      ? formatDirectoryLocation(other, otherRole)
      : null;
  const paid = match.status === "Paid";
  const dateReady = isDateNegotiationComplete(match);

  const hostInitiated = match.initiator_id === match.host_id;
  const iAmDecider = (iAmHost && !hostInitiated) || (!iAmHost && hostInitiated);
  const isGuestAcceptingHostInvite = !iAmHost && hostInitiated && (match.status === "Pending" || match.status === "Hold");

  const partySize = isGuestAcceptingHostInvite ? selectedPartySize : (match.party_size ?? 1);
  const total = FEE_PER_PERSON * partySize;
  const hostEarnings = partySize * HOST_PAYOUT_EUR;

  async function startPayoutSetup() {
    setWorking("payout");
    setError(null);
    try {
      const res = await fetch("/api/stripe/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ returnPath: "/matches" }),
      });
      const body = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
      if (!res.ok || !body.url) {
        setError(body.error ?? "Could not start payout setup.");
        return;
      }
      window.location.href = body.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error");
    } finally {
      setWorking(null);
    }
  }

  const mapQuery = iAmHost
    ? (other?.origin_location ?? "")
    : other?.neighborhood
      ? `${other.neighborhood}, Dublin, Ireland`
      : "";
  const mapZoom = iAmHost ? 5 : 13;
  const mapLabel = iAmHost
    ? `Where ${other?.full_name ?? "this traveler"} is from`
    : `${other?.full_name ?? "this host"}'s area`;

  async function act(kind: "accept" | "hold" | "decline") {
    setWorking(kind);
    setError(null);
    try {
      if (kind === "accept") {
        const res = await fetch("/api/matches/accept", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            matchId: match.id,
            partySize: isGuestAcceptingHostInvite ? selectedPartySize : undefined
          }),
        });
        const body = (await res.json().catch(() => ({}))) as {
          error?: string;
          code?: string;
          hostEarningsEur?: number;
        };
        if (!res.ok) {
          if (body.code === "PAYOUT_SETUP_REQUIRED" && iAmHost) {
            setPayoutPromptEur(body.hostEarningsEur ?? hostEarnings);
            setError(null);
            return;
          }
          setError(body.error ?? `Failed (${res.status})`);
          return;
        }
      } else {
        const res = await fetch("/api/matches/decision", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ matchId: match.id, decision: kind === "hold" ? "Hold" : "Denied" }),
        });
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        if (!res.ok) {
          setError(body.error ?? `Failed (${res.status})`);
          return;
        }
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error");
    } finally {
      setWorking(null);
    }
  }

  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_4px_15px_rgba(0,47,167,0.01)] transition-all duration-300 hover:shadow-[0_12px_30px_rgba(0,47,167,0.02)]">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href={`/profile/${other?.id ?? ""}`}
            className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-full bg-slate-50 border border-slate-150"
          >
            {other?.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={other.avatar_url} alt={other.full_name ?? ""} className="h-full w-full object-cover" />
            ) : (
              <span className="flex h-full w-full items-center justify-center text-sm font-light text-slate-400">
                {other?.full_name?.charAt(0) ?? "?"}
              </span>
            )}
          </Link>
          <div>
            <Link href={`/profile/${other?.id ?? ""}`} className="font-serif text-lg font-normal text-slate-950 hover:text-[#002FA7] transition-colors duration-300">
              {other?.full_name ?? (iAmHost ? "Traveler" : "Host")}
            </Link>
            {otherLocation && (
              <p className="flex items-center gap-1 text-xs text-slate-400 font-light mt-0.5">
                <MapPin className="h-3.5 w-3.5 text-[#002FA7]/70" />
                {otherLocation}
              </p>
            )}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className={`rounded-full px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider ${STATUS_STYLE[match.status]}`}>
            {match.status}
          </span>
          <span className="text-[11px] font-mono text-slate-400">
            {partySize} {partySize === 1 ? "person" : "people"} · €{total}
          </span>
        </div>
      </div>

      {mapQuery && (
        <div className="mt-6">
          <span className="block font-mono text-[11px] uppercase tracking-widest text-[#002FA7] font-semibold mb-3">
            ✦ {mapLabel}
          </span>
          <div className="overflow-hidden rounded-2xl border border-slate-150 shadow-[inset_0_2px_4px_rgba(0,0,0,0.01)]">
            <LocationMap query={mapQuery} zoom={mapZoom} label="" />
          </div>
        </div>
      )}

      <div className="mt-5 w-full min-w-0 space-y-4">
        {!paid && match.status !== "Denied" && (
          <MatchDateNegotiation
            match={match}
            currentUserId={currentUserId}
            hostId={match.host_id}
          />
        )}

        {isGuestAcceptingHostInvite && dateReady && (
          <div className="space-y-1.5 max-w-xs">
            <label htmlFor={`party-confirm-${match.id}`} className="block text-[10px] font-mono uppercase tracking-wider text-slate-400">
              Confirm how many people? (€35 each, max {MAX_PARTY_SIZE})
            </label>
            <p className="flex items-start gap-1.5 text-xs text-slate-500 font-light leading-relaxed">
              <Info className="h-3.5 w-3.5 shrink-0 mt-0.5 text-[#002FA7]/70" />
              €35 per person unlocks chat and contact details. Your host receives €25 per person.
            </p>
            <select
              id={`party-confirm-${match.id}`}
              value={selectedPartySize}
              onChange={(e) => setSelectedPartySize(Number(e.target.value))}
              className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-950 focus:border-[#002FA7] focus:outline-none focus:ring-1 focus:ring-[#002FA7] transition-all font-light"
            >
              {Array.from({ length: MAX_PARTY_SIZE }, (_, i) => i + 1).map((n) => (
                <option key={n} value={n}>
                  {n} {n === 1 ? "person" : "people"} — €{n * FEE_PER_PERSON}
                </option>
              ))}
            </select>
          </div>
        )}

        {payoutPromptEur !== null && iAmHost && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-5 space-y-3">
            <p className="font-serif text-base text-emerald-950">
              You have <strong>€{payoutPromptEur}</strong> waiting from this visit.
            </p>
            <p className="text-sm text-emerald-800/90 font-light leading-relaxed">
              Add your IBAN through Stripe to accept the booking and receive your payout when the traveler pays.
            </p>
            <button
              type="button"
              onClick={startPayoutSetup}
              disabled={working !== null}
              className="inline-flex items-center gap-2 rounded-full bg-[#002FA7] px-6 py-3 text-xs font-mono font-semibold uppercase tracking-widest text-white transition-all duration-300 hover:bg-[#001e6c] disabled:opacity-50 shadow-sm"
            >
              {working === "payout" ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Add bank details &amp; accept
            </button>
          </div>
        )}

        {!dateReady && (match.status === "Pending" || match.status === "Hold") && (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => act("decline")}
              disabled={working !== null}
              className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-white px-5 py-2.5 text-xs font-mono font-semibold uppercase tracking-wider text-rose-600 transition-all duration-300 hover:bg-rose-50/50 disabled:opacity-50"
            >
              {working === "decline" ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
              Decline
            </button>
          </div>
        )}

        {iAmDecider && dateReady && (match.status === "Pending" || match.status === "Hold") ? (
          <div className="flex flex-wrap gap-2 pt-2">
            <button
              type="button"
              onClick={() => act("accept")}
              disabled={working !== null}
              className="inline-flex items-center gap-1.5 rounded-full bg-[#002FA7] px-5 py-2.5 text-xs font-mono font-semibold uppercase tracking-wider text-white transition-all duration-300 hover:bg-[#001e6c] disabled:opacity-50 shadow-sm"
            >
              {working === "accept" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              {isGuestAcceptingHostInvite ? "Confirm & Accept" : "Accept"}
            </button>
            {match.status !== "Hold" && (
              <button
                type="button"
                onClick={() => act("hold")}
                disabled={working !== null}
                className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-5 py-2.5 text-xs font-mono font-semibold uppercase tracking-wider text-slate-650 transition-all duration-300 hover:bg-slate-50 disabled:opacity-50"
              >
                {working === "hold" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Clock className="h-4 w-4" />}
                Hold
              </button>
            )}
            <button
              type="button"
              onClick={() => act("decline")}
              disabled={working !== null}
              className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-white px-5 py-2.5 text-xs font-mono font-semibold uppercase tracking-wider text-rose-600 transition-all duration-300 hover:bg-rose-50/50 disabled:opacity-50"
            >
              {working === "decline" ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
              Decline
            </button>
          </div>
        ) : (
          (match.status === "Pending" || match.status === "Hold") && (
            <button
              type="button"
              disabled
              className="cursor-not-allowed rounded-full bg-slate-50 border border-slate-150 px-5 py-2.5 text-xs font-mono font-semibold uppercase tracking-wider text-slate-400"
            >
              {!dateReady
                ? "Agree on a visit date first"
                : `Awaiting ${iAmHost ? "guest" : "host"} response`}
            </button>
          )
        )}

        {iAmHost && match.status === "Accepted" && (
          <p className="text-xs font-mono uppercase tracking-widest text-[#002FA7]">Accepted — awaiting traveler payment.</p>
        )}

        {!iAmHost && match.status === "Accepted" && match.stripe_link && (
          <a
            href={match.stripe_link}
            className="inline-flex rounded-full bg-[#002FA7] px-6 py-3 text-xs font-mono font-semibold uppercase tracking-widest text-white transition-all duration-300 hover:bg-[#001e6c] shadow-[0_4px_15px_rgba(0,47,167,0.18)]"
          >
            Pay €{total} to Unlock Connection ({partySize} × €35)
          </a>
        )}

        {match.status === "Denied" && (
          <p className="text-sm text-rose-600 font-light">
            {iAmDecider ? "You declined this request." : "This connection request was declined."}
          </p>
        )}

        {error && (
          <p className="mt-2 text-sm text-rose-600 font-light" role="alert">
            {error}
          </p>
        )}
      </div>

      {paid && other && (
        <div className="mt-6 border-t border-slate-100 pt-6 space-y-4">
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="block font-mono text-[9px] uppercase tracking-[0.25em] text-[#002FA7] font-bold">
              Member Info
            </span>
          </div>

          {/* Structured Contact Vector Grid */}
          <div className="grid gap-3 sm:grid-cols-2 font-mono text-xs text-slate-600">
            <div className="flex items-center gap-2.5 rounded-xl bg-slate-50/70 px-4 py-3 border border-slate-100 shadow-sm">
              <Phone className="h-4 w-4 text-[#002FA7] shrink-0" />
              <div className="min-w-0 flex-1">
                <span className="block text-[8px] uppercase tracking-wider text-slate-400 font-bold">Phone Number</span>
                <span className="text-slate-800 tracking-wider font-medium">{other.phone || "—"}</span>
              </div>
              {other.phone && (
                <WhatsAppButton
                  phone={other.phone}
                  message={`Hi ${other.full_name || "there"}! This is ${
                    myRole === "Host" ? match.host?.full_name : match.guest?.full_name
                  } from WalkIn Locals. Our connection is confirmed! Let's arrange our cozy sit-down. ✦`}
                />
              )}
            </div>

            <div className="flex items-center gap-2.5 rounded-xl bg-slate-50/70 px-4 py-3 border border-slate-100 shadow-sm">
              <Mail className="h-4 w-4 text-[#002FA7] shrink-0" />
              <div className="min-w-0">
                <span className="block text-[8px] uppercase tracking-wider text-slate-400 font-bold">Email Coordinate</span>
                <span className="text-slate-800 break-all font-medium">{other.contact_email || "—"}</span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-slate-50/40 p-4 text-xs font-light leading-relaxed text-slate-500 mt-2">
            Your connection is protected by WalkIn Locals — use the secure ledger in-app chat frame below to coordinate arrival times.
          </div>

          <div className="mt-4">
            <ChatBox matchId={match.id} currentUserId={currentUserId} />
          </div>
        </div>
      )}
    </article>
  );
}