"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
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
  MessageCircle,
} from "lucide-react";
import { MAX_PARTY_SIZE, HOST_PAYOUT_EUR, MATCH_FEE_EUR } from "@/lib/pricing";
import { PAGE_MAIN } from "@/lib/page-layout";
import { heroTitle } from "@/lib/homepage-ui";
import { formatDirectoryLocation } from "@/lib/directory-display";
import ChatBox from "@/components/chat-box";
import LocationMap from "@/components/location-map";
import MatchDateNegotiation from "@/components/match-date-negotiation";
import WhatsAppButton from "@/components/whatsapp-button";
import { isDateNegotiationComplete } from "@/lib/match-dates";

const FEE_PER_PERSON = MATCH_FEE_EUR;

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
  paymentReturnPending?: boolean;
  paidMatchId?: string | null;
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
  paymentReturnPending = false,
  paidMatchId = null,
  connectComplete = false,
}: Props) {
  const router = useRouter();
  const [payoutsReady, setPayoutsReady] = useState(false);
  const [paymentSyncing, setPaymentSyncing] = useState(paymentReturnPending);

  useEffect(() => {
    if (!paymentReturnPending) return;

    let cancelled = false;

    (async () => {
      try {
        await fetch("/api/matches/sync-payment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ matchId: paidMatchId ?? undefined }),
        });
      } finally {
        if (!cancelled) {
          router.replace("/matches");
          router.refresh();
          setPaymentSyncing(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [paymentReturnPending, paidMatchId, router]);

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
    <main className={PAGE_MAIN}>
      <h1 className={heroTitle}>
        Your matches
      </h1>
      <p className="mt-5 text-lg leading-relaxed text-slate-950 sm:text-xl sm:leading-relaxed">
        Manage connection requests, respond to invitations, and unlock contact details after payment.
      </p>

      {payoutsReady && (
        <p className="mt-8 flex items-center gap-2 text-base text-emerald-800">
          <Check className="h-5 w-5 shrink-0 text-emerald-600" />
          <span>Bank details saved — tap <strong>Accept</strong> on your pending visit to confirm it.</span>
        </p>
      )}

      {paymentSyncing && (
        <p className="mt-8 flex items-center gap-2 text-base text-slate-700 sm:text-lg">
          <Loader2 className="h-5 w-5 shrink-0 animate-spin text-[#002FA7]" />
          <span>Confirming your payment with Stripe…</span>
        </p>
      )}

      {justPaid && !paymentSyncing && (
        <p className="mt-8 flex items-center gap-2 text-base text-emerald-800">
          <PartyPopper className="h-5 w-5 shrink-0 text-emerald-600" />
          <span>Payment received — your connection is unlocked below.</span>
        </p>
      )}

      {loadError && (
        <p className="mt-6 text-base text-red-600" role="alert">
          Could not load your matches: {loadError}
        </p>
      )}

      <div className="mt-12 space-y-6">
        {matches.length === 0 && !loadError && (
          <p className="rounded-2xl border border-slate-200/80 py-16 text-center text-base text-slate-600 sm:text-lg">
            You don&apos;t have any matches yet.
          </p>
        )}
        {matches.map((m) => (
          <MatchCard
            key={m.id}
            match={m}
            currentUserId={currentUserId}
            myRole={myRole}
            paymentSyncing={paymentSyncing}
          />
        ))}
      </div>
    </main>
  );
}

function MatchCard({
  match,
  currentUserId,
  myRole,
  paymentSyncing = false,
}: {
  match: MatchRow;
  currentUserId: string;
  myRole: "Guest" | "Host";
  paymentSyncing?: boolean;
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
    ? `Where ${other?.full_name ?? "this backpacker"} is from`
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
    <article className="rounded-2xl border border-slate-200/80 p-6 shadow-sm sm:p-8 lg:p-10">
      <div className="lg:grid lg:grid-cols-12 lg:gap-12 xl:gap-16">
        <div className="lg:col-span-4">
          <div className="flex items-start gap-4">
            <Link
              href={`/profile/${other?.id ?? ""}`}
              className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-full bg-slate-100 ring-1 ring-slate-200/80 sm:h-24 sm:w-24"
            >
              {other?.avatar_url ? (
                <Image src={other.avatar_url} alt={other.full_name ?? ""} fill sizes="96px" className="object-cover" />
              ) : (
                <span className="flex h-full w-full items-center justify-center text-lg text-slate-400">
                  {other?.full_name?.charAt(0) ?? "?"}
                </span>
              )}
            </Link>
            <div className="min-w-0">
              <Link
                href={`/profile/${other?.id ?? ""}`}
                className="text-2xl font-bold text-slate-950 hover:text-[#002FA7] sm:text-3xl"
              >
                {other?.full_name ?? (iAmHost ? "Backpacker" : "Host")}
              </Link>
              {otherLocation && (
                <p className="mt-2 flex items-center gap-1.5 text-sm text-slate-600 sm:text-base">
                  <MapPin className="h-4 w-4 shrink-0 text-[#002FA7]/70" />
                  {otherLocation}
                </p>
              )}
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <span className={`rounded-full px-3 py-1 text-sm font-medium ${STATUS_STYLE[match.status]}`}>
                  {match.status}
                </span>
                <span className="text-sm text-slate-600 sm:text-base">
                  {partySize} {partySize === 1 ? "person" : "people"} · €{total}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 w-full min-w-0 space-y-6 lg:col-span-8 lg:mt-0">
        {mapQuery && (
          <div>
            <span className="text-sm font-semibold uppercase tracking-wide text-[#002FA7]">{mapLabel}</span>
            <div className="mt-3 overflow-hidden rounded-xl border border-slate-200/80">
              <LocationMap query={mapQuery} zoom={mapZoom} label="" />
            </div>
          </div>
        )}

        {!paid && match.status !== "Denied" && (
          <MatchDateNegotiation
            match={match}
            currentUserId={currentUserId}
            hostId={match.host_id}
          />
        )}

        {isGuestAcceptingHostInvite && dateReady && (
          <div className="space-y-1.5 max-w-xs">
            <label htmlFor={`party-confirm-${match.id}`} className="block text-sm font-medium text-slate-700">
              How many people?
            </label>
            <p className="flex items-start gap-1.5 text-xs text-slate-500 font-light leading-relaxed">
              <Info className="h-3.5 w-3.5 shrink-0 mt-0.5 text-[#002FA7]/70" />
              €25 per person unlocks chat and contact details. Your host receives €15 per person.
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
              Add your IBAN through Stripe to accept the booking and receive your payout when the backpacker pays.
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
          <p className="text-xs font-mono uppercase tracking-widest text-[#002FA7]">Accepted — awaiting backpacker payment.</p>
        )}

        {!iAmHost && match.status === "Accepted" && match.stripe_link && !paymentSyncing && (
          <a
            href={match.stripe_link}
            className="inline-flex rounded-full bg-[#002FA7] px-6 py-3 text-xs font-mono font-semibold uppercase tracking-widest text-white transition-all duration-300 hover:bg-[#001e6c] shadow-[0_4px_15px_rgba(0,47,167,0.18)]"
          >
            Pay €{total} to Unlock Connection ({partySize} × €{MATCH_FEE_EUR})
          </a>
        )}

        {!iAmHost && match.status === "Accepted" && match.stripe_link && paymentSyncing && (
          <p className="text-sm text-slate-600 sm:text-base">
            Payment processing — contact details will appear here in a moment.
          </p>
        )}

        {match.status === "Denied" && (
          <p className="text-sm text-rose-600 font-light">
            {iAmDecider ? "You declined this request." : "This connection request was declined."}
          </p>
        )}

        {error && (
          <p className="mt-2 text-base text-rose-600" role="alert">
            {error}
          </p>
        )}

        {paid && other && (
          <div className="border-t border-slate-200/80 pt-8 space-y-6">
            <p className="text-sm font-semibold uppercase tracking-wide text-[#002FA7]">Contact unlocked</p>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 text-base text-slate-700">
              <div className="flex items-start gap-3">
                <Phone className="h-5 w-5 text-[#002FA7] shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <span className="text-sm text-slate-500 sm:text-base">Phone</span>
                  <p className="font-medium text-slate-950 sm:text-lg">{other.phone || "—"}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Mail className="h-5 w-5 text-[#002FA7] shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <span className="text-sm text-slate-500 sm:text-base">Email</span>
                  <p className="font-medium text-slate-950 break-all sm:text-lg">{other.contact_email || "—"}</p>
                </div>
              </div>

              {other.phone ? (
                <div className="flex items-start gap-3">
                  <MessageCircle className="h-5 w-5 text-[#002FA7] shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <span className="text-sm text-slate-500 sm:text-base">WhatsApp</span>
                    <div className="mt-1">
                      <WhatsAppButton
                        phone={other.phone}
                        message={`Hi ${other.full_name || "there"}! This is ${
                          myRole === "Host" ? match.host?.full_name : match.guest?.full_name
                        } from WALKINLOCALS. Our connection is confirmed! Let's arrange our cozy sit-down. ✦`}
                        className="h-10 w-10"
                      />
                    </div>
                  </div>
                </div>
              ) : null}
            </div>

            <p className="text-sm leading-relaxed text-slate-600">
              Use in-app chat below to coordinate your visit.
            </p>

            <ChatBox matchId={match.id} currentUserId={currentUserId} />
          </div>
        )}
        </div>
      </div>
    </article>
  );
}