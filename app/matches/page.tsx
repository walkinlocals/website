import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import MatchesView, { type MatchRow } from "@/components/matches-view";
import { PAGE_SHELL } from "@/lib/page-layout";
import {
  syncGuestAcceptedPayments,
  syncMatchPaymentFromStripe,
} from "@/lib/sync-match-payment";

export const dynamic = "force-dynamic";

export default async function MatchesPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; connect?: string; match?: string }>;
}) {
  const { success, connect, match: paidMatchId } = await searchParams;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  if (success === "true") {
    if (paidMatchId) {
      await syncMatchPaymentFromStripe(paidMatchId, user.id);
    } else {
      await syncGuestAcceptedPayments(user.id);
    }
  }

  if (success === "true") {
    if (paidMatchId) {
      await syncMatchPaymentFromStripe(paidMatchId, user.id);
    } else {
      await syncGuestAcceptedPayments(user.id);
    }
  }

  const { data: me } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  let { data: matches, error } = await supabase
    .from("matches")
    .select(
      `
      id, guest_id, host_id, status, stripe_link, party_size, initiator_id, created_at,
      proposed_date, proposed_time, date_proposed_by, date_confirmed,
      host:profiles!matches_host_id_fkey(id, full_name, avatar_url, neighborhood, origin_location, phone, contact_email, id_verified),
      guest:profiles!matches_guest_id_fkey(id, full_name, avatar_url, neighborhood, origin_location, phone, contact_email, id_verified)
      `,
    )
    .or(`guest_id.eq.${user.id},host_id.eq.${user.id}`)
    .order("created_at", { ascending: false });

  let rows = (matches as unknown as MatchRow[]) ?? [];

  const guestHasAwaitingPayment = rows.some(
    (m) => m.guest_id === user.id && m.status === "Accepted",
  );
  if (guestHasAwaitingPayment) {
    await syncGuestAcceptedPayments(user.id);
    const refetch = await supabase
      .from("matches")
      .select(
        `
        id, guest_id, host_id, status, stripe_link, party_size, initiator_id, created_at,
        proposed_date, proposed_time, date_proposed_by, date_confirmed,
        host:profiles!matches_host_id_fkey(id, full_name, avatar_url, neighborhood, origin_location, phone, contact_email, id_verified),
        guest:profiles!matches_guest_id_fkey(id, full_name, avatar_url, neighborhood, origin_location, phone, contact_email, id_verified)
        `,
      )
      .or(`guest_id.eq.${user.id},host_id.eq.${user.id}`)
      .order("created_at", { ascending: false });
    matches = refetch.data;
    error = refetch.error;
    rows = (matches as unknown as MatchRow[]) ?? [];
  }
  const paymentConfirmed =
    success === "true" && rows.some((m) => m.status === "Paid");

  return (
    <div className={`${PAGE_SHELL} font-sans text-slate-950 antialiased`}>
      <MatchesView
        currentUserId={user.id}
        myRole={(me?.role as "Guest" | "Host") ?? "Guest"}
        matches={rows}
        loadError={error?.message ?? null}
        justPaid={paymentConfirmed}
        paymentReturnPending={success === "true" && !paymentConfirmed}
        paidMatchId={paidMatchId ?? null}
        connectComplete={connect === "complete"}
      />
    </div>
  );
}
