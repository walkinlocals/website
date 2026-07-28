import { stripe } from "@/lib/stripe/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

async function checkoutSessionIsPaid(sessionId: string): Promise<boolean> {
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    return session.payment_status === "paid";
  } catch {
    return false;
  }
}

async function findPaidSessionForMatch(matchId: string): Promise<boolean> {
  const { data: row } = await supabaseAdmin
    .from("matches")
    .select("stripe_session_id")
    .eq("id", matchId)
    .maybeSingle();

  const storedId = row?.stripe_session_id as string | null | undefined;
  if (storedId && (await checkoutSessionIsPaid(storedId))) {
    return true;
  }

  // Fallback for older rows (no stored session id) or webhook-only metadata
  const list = await stripe.checkout.sessions.list({ limit: 100 });
  return list.data.some(
    (session) => session.metadata?.match_id === matchId && session.payment_status === "paid",
  );
}

/**
 * If Stripe shows a paid checkout for this match, mark it Paid in the DB.
 * Used when the webhook is missing (local dev) or delayed.
 */
export async function syncMatchPaymentFromStripe(
  matchId: string,
  actingUserId: string,
): Promise<{ synced: boolean; status: string }> {
  const { data: match, error } = await supabaseAdmin
    .from("matches")
    .select("id, guest_id, host_id, status")
    .eq("id", matchId)
    .maybeSingle();

  if (error || !match) {
    return { synced: false, status: "not_found" };
  }

  if (match.guest_id !== actingUserId && match.host_id !== actingUserId) {
    return { synced: false, status: "forbidden" };
  }

  if (match.status === "Paid") {
    return { synced: true, status: "Paid" };
  }

  if (match.status !== "Accepted") {
    return { synced: false, status: match.status };
  }

  const paid = await findPaidSessionForMatch(matchId);
  if (!paid) {
    return { synced: false, status: match.status };
  }

  const { error: updateError } = await supabaseAdmin
    .from("matches")
    .update({ status: "Paid" })
    .eq("id", matchId)
    .eq("status", "Accepted");

  if (updateError) {
    return { synced: false, status: match.status };
  }

  return { synced: true, status: "Paid" };
}

/** Sync any Accepted matches for this guest that already paid on Stripe. */
export async function syncGuestAcceptedPayments(guestId: string): Promise<number> {
  const { data: rows } = await supabaseAdmin
    .from("matches")
    .select("id")
    .eq("guest_id", guestId)
    .eq("status", "Accepted");

  let count = 0;
  for (const row of rows ?? []) {
    const result = await syncMatchPaymentFromStripe(row.id, guestId);
    if (result.synced && result.status === "Paid") count += 1;
  }
  return count;
}
