"use client";

import { useState } from "react";
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
} from "lucide-react";
import ChatBox from "@/components/chat-box";
import LocationMap from "@/components/location-map";

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
  host: PartyProfile | null;
  guest: PartyProfile | null;
}

interface Props {
  currentUserId: string;
  myRole: "Guest" | "Host";
  matches: MatchRow[];
  loadError: string | null;
  justPaid: boolean;
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
}: Props) {
  return (
    <main className="mx-auto max-w-3xl px-6 py-14 text-slate-900 sm:py-20">
      <span className="inline-flex items-center gap-1 font-mono text-[9px] uppercase tracking-[0.3em] text-[#002FA7] font-semibold bg-[#002fa7]/5 px-3 py-1 rounded-full mb-4">
        ✦ Connections Panel ✦
      </span>
      <h1 className="font-serif text-3xl font-normal tracking-tight text-slate-950 sm:text-4xl">Your matches</h1>
      <p className="mt-2 text-sm text-slate-500 font-light leading-relaxed">
        {myRole === "Host"
          ? "Manage your guest connections. Respond to incoming visits or invite pending backpackers."
          : "Track your requests. Specify backpackers and complete your payments to unlock chat doors."}
      </p>

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
  const [working, setWorking] = useState<null | "accept" | "hold" | "decline">(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedPartySize, setSelectedPartySize] = useState(match.party_size ?? 1);

  const iAmHost = match.host_id === currentUserId;
  const other = iAmHost ? match.guest : match.host;
  const otherLocation = iAmHost ? other?.origin_location : other?.neighborhood;
  const paid = match.status === "Paid";

  const hostInitiated = match.initiator_id === match.host_id;
  const iAmDecider = (iAmHost && !hostInitiated) || (!iAmHost && hostInitiated);
  const isGuestAcceptingHostInvite = !iAmHost && hostInitiated && (match.status === "Pending" || match.status === "Hold");

  const partySize = isGuestAcceptingHostInvite ? selectedPartySize : (match.party_size ?? 1);
  const total = FEE_PER_PERSON * partySize;

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
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        if (!res.ok) {
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
              {other?.full_name ?? (iAmHost ? "Backpacker" : "Host")}
            </Link>
            {otherLocation && (
              <p className="flex items-center gap-1 text-xs text-slate-400 font-light mt-0.5">
                <MapPin className="h-3.5 w-3.5 text-[#002FA7]/70" />
                {iAmHost ? `From ${otherLocation}` : otherLocation}
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

      <div className="mt-5 space-y-4">
        {isGuestAcceptingHostInvite && (
          <div className="space-y-1.5 max-w-xs">
            <label htmlFor={`party-confirm-${match.id}`} className="block text-[10px] font-mono uppercase tracking-wider text-slate-400">
              Confirm how many people? (€35 each, max 5)
            </label>
            <select
              id={`party-confirm-${match.id}`}
              value={selectedPartySize}
              onChange={(e) => setSelectedPartySize(Number(e.target.value))}
              className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-950 focus:border-[#002FA7] focus:outline-none focus:ring-1 focus:ring-[#002FA7] transition-all font-light"
            >
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>
                  {n} {n === 1 ? "person" : "people"} — €{n * FEE_PER_PERSON}
                </option>
              ))}
            </select>
          </div>
        )}

        {iAmDecider && (match.status === "Pending" || match.status === "Hold") ? (
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
              Awaiting {iAmHost ? "guest" : "host"} response
            </button>
          )
        )}

        {iAmHost && match.status === "Accepted" && (
          <p className="text-xs font-mono uppercase tracking-widest text-[#002FA7]">Accepted — awaiting backpacker payment.</p>
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
        <div className="mt-6 border-t border-slate-100 pt-6">
          <div className="grid gap-2 sm:grid-cols-2 mb-4">
            <p className="flex items-center gap-2 text-sm text-slate-650 font-light">
              <Phone className="h-4 w-4 text-[#002FA7] stroke-[1.5]" />
              <span>{other.phone || "No phone provided"}</span>
            </p>
            <p className="flex items-center gap-2 text-sm text-slate-650 font-light">
              <Mail className="h-4 w-4 text-[#002FA7] stroke-[1.5]" />
              <span className="break-all">{other.contact_email || "No email provided"}</span>
            </p>
          </div>

          {/* Secure WhatsApp Handshake Trigger Button */}
          {other.phone && (
            <div className="flex gap-3 mb-6">
              <a
                href={`https://wa.me/${other.phone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(
                  `Hi ${other.full_name || "there"}! This is ${
                    myRole === "Host" ? match.host?.full_name : match.guest?.full_name
                  } from WalkIn Locals. Our connection is confirmed! Let's arrange our cozy sit-down. ✦`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-[#25D366] hover:bg-[#20ba5a] text-white px-5 py-2.5 font-mono text-[11px] uppercase font-semibold tracking-wider transition-all duration-300"
              >
                <Phone className="h-3.5 w-3.5 fill-current" />
                Text on WhatsApp
              </a>
            </div>
          )}

          <div className="mt-4">
            <ChatBox matchId={match.id} currentUserId={currentUserId} />
          </div>
        </div>
      )}
    </article>
  );
}