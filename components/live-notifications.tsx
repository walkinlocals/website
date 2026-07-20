"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { usePageToast } from "@/components/page-toast";
import { formatVisitDateTime } from "@/lib/match-dates";

interface MatchSnapshot {
  id: string;
  status: string;
  proposed_date: string | null;
  proposed_time: string | null;
  date_proposed_by: string | null;
  date_confirmed: boolean | null;
  initiator_id: string | null;
  guest_id: string;
  host_id: string;
}

interface MessageSnapshot {
  id: string;
  match_id: string;
  sender_id: string;
  content: string;
}

function otherPartyId(match: MatchSnapshot, userId: string): string {
  return match.guest_id === userId ? match.host_id : match.guest_id;
}

function previewMessage(content: string): string {
  const trimmed = content.trim();
  if (trimmed.length <= 90) return trimmed;
  return `${trimmed.slice(0, 87)}…`;
}

export default function LiveNotifications() {
  const router = useRouter();
  const supabase = createClient();
  const { pushToast } = usePageToast();
  const userIdRef = useRef<string | null>(null);
  const snapshotsRef = useRef<Map<string, MatchSnapshot>>(new Map());
  const messageIdsRef = useRef<Set<string>>(new Set());
  const paidMatchIdsRef = useRef<Set<string>>(new Set());
  const readyRef = useRef(false);

  useEffect(() => {
    let active = true;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    async function loadName(otherId: string): Promise<string> {
      const { data } = await supabase.from("profiles").select("full_name").eq("id", otherId).maybeSingle();
      return data?.full_name?.trim() || "Someone";
    }

    function remember(match: MatchSnapshot) {
      snapshotsRef.current.set(match.id, match);
      if (match.status === "Paid") {
        paidMatchIdsRef.current.add(match.id);
      }
    }

    async function notifyNewMatch(match: MatchSnapshot) {
      if (!userIdRef.current || match.initiator_id === userIdRef.current) return;

      const name = await loadName(otherPartyId(match, userIdRef.current));
      const hasDate = Boolean(match.proposed_date);

      pushToast({
        title: "New match",
        message: hasDate
          ? `${name} sent you a visit request. Open Matches to respond.`
          : `${name} invited you to connect. Open Matches to pick a visit date.`,
        href: "/matches",
      });
      router.refresh();
    }

    async function notifyUpdate(before: MatchSnapshot, after: MatchSnapshot) {
      const userId = userIdRef.current;
      if (!userId) return;

      const otherId = otherPartyId(after, userId);
      const name = await loadName(otherId);

      if (before.status !== after.status) {
        if (after.status === "Accepted") {
          pushToast({
            title: "Match accepted",
            message: `${name} accepted your connection. Open Matches to continue.`,
            href: "/matches",
          });
        } else if (after.status === "Denied") {
          pushToast({
            title: "Match declined",
            message: `${name} declined the connection request.`,
            href: "/matches",
          });
        } else if (after.status === "Paid") {
          paidMatchIdsRef.current.add(after.id);
          pushToast({
            title: "Payment received",
            message: `Your connection with ${name} is now unlocked — Live Connection Chat is ready.`,
            href: "/matches",
          });
        } else if (after.status === "Hold") {
          pushToast({
            title: "Match on hold",
            message: `${name} put your connection on hold.`,
            href: "/matches",
          });
        }
        router.refresh();
        return;
      }

      if (
        after.proposed_date &&
        after.date_proposed_by &&
        after.date_proposed_by !== userId &&
        (before.proposed_date !== after.proposed_date || before.date_proposed_by !== after.date_proposed_by)
      ) {
        pushToast({
          title: "Visit date proposed",
          message: `${name} suggested ${formatVisitDateTime(after.proposed_date, after.proposed_time)}. Open Matches to accept or suggest another date.`,
          href: "/matches",
        });
        router.refresh();
        return;
      }

      if (!before.date_confirmed && after.date_confirmed && after.proposed_date) {
        pushToast({
          title: "Visit date confirmed",
          message: `You agreed on ${formatVisitDateTime(after.proposed_date, after.proposed_time)} with ${name}.`,
          href: "/matches",
        });
        router.refresh();
      }
    }

    async function notifyNewMessage(message: MessageSnapshot) {
      const userId = userIdRef.current;
      if (!userId || message.sender_id === userId) return;
      if (!paidMatchIdsRef.current.has(message.match_id)) return;
      if (messageIdsRef.current.has(message.id)) return;

      messageIdsRef.current.add(message.id);

      const { data: match } = await supabase
        .from("matches")
        .select("guest_id, host_id")
        .eq("id", message.match_id)
        .maybeSingle();

      if (!match || (match.guest_id !== userId && match.host_id !== userId)) return;

      const name = await loadName(message.sender_id);
      pushToast({
        title: "Live connection chat",
        message: `${name}: ${previewMessage(message.content)}`,
        href: "/matches",
      });
      router.refresh();
    }

    async function bootstrap() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!active || !user) return;

      userIdRef.current = user.id;

      const { data: matches } = await supabase
        .from("matches")
        .select(
          "id, status, proposed_date, proposed_time, date_proposed_by, date_confirmed, initiator_id, guest_id, host_id",
        )
        .or(`guest_id.eq.${user.id},host_id.eq.${user.id}`);

      snapshotsRef.current = new Map(
        (matches ?? []).map((match) => [match.id, match as MatchSnapshot]),
      );

      paidMatchIdsRef.current = new Set(
        (matches ?? []).filter((match) => match.status === "Paid").map((match) => match.id),
      );

      const paidMatchIds = [...paidMatchIdsRef.current];
      if (paidMatchIds.length > 0) {
        const { data: messages } = await supabase
          .from("messages")
          .select("id")
          .in("match_id", paidMatchIds);

        messageIdsRef.current = new Set((messages ?? []).map((message) => message.id));
      }

      readyRef.current = true;

      channel = supabase
        .channel(`live-notifications-${user.id}`)
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "matches" },
          (payload) => {
            const match = payload.new as MatchSnapshot;
            if (match.guest_id !== user.id && match.host_id !== user.id) return;
            if (!readyRef.current) {
              remember(match);
              return;
            }
            if (snapshotsRef.current.has(match.id)) return;
            remember(match);
            void notifyNewMatch(match);
          },
        )
        .on(
          "postgres_changes",
          { event: "UPDATE", schema: "public", table: "matches" },
          (payload) => {
            const before = payload.old as MatchSnapshot;
            const after = payload.new as MatchSnapshot;
            if (after.guest_id !== user.id && after.host_id !== user.id) return;
            if (!readyRef.current) {
              remember(after);
              return;
            }
            const previous = snapshotsRef.current.get(after.id) ?? before;
            remember(after);
            void notifyUpdate(previous, after);
          },
        )
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "messages" },
          (payload) => {
            const message = payload.new as MessageSnapshot;
            if (!readyRef.current) {
              messageIdsRef.current.add(message.id);
              return;
            }
            void notifyNewMessage(message);
          },
        )
        .subscribe();
    }

    void bootstrap();

    return () => {
      active = false;
      readyRef.current = false;
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [pushToast, router, supabase]);

  return null;
}
