import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * POST /api/matches/decision   Body: { matchId, decision: 'Hold' | 'Denied' }
 *
 * Dynamic Decider Action. Puts a request on hold or declines it.
 * (Accepting goes through /api/matches/accept because it creates a Stripe checkout.)
 */
export async function POST(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  let body: { matchId?: unknown; decision?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { matchId, decision } = body;
  if (typeof matchId !== "string" || !matchId) {
    return NextResponse.json({ error: "matchId is required." }, { status: 400 });
  }
  if (decision !== "Hold" && decision !== "Denied") {
    return NextResponse.json({ error: "decision must be 'Hold' or 'Denied'." }, { status: 400 });
  }

  // Fetch match details, including our new initiator_id tracker
  const { data: match } = await supabase
    .from("matches")
    .select("id, host_id, guest_id, status, initiator_id")
    .eq("id", matchId)
    .single();

  if (!match) return NextResponse.json({ error: "Match not found." }, { status: 404 });

  if (match.status === "Paid") {
    return NextResponse.json({ error: "A paid connection can't be changed." }, { status: 409 });
  }

  // ---------------------------------------------------------------------------
  // DYNAMIC DECISION RIGHTS CALCULATIONS
  // ---------------------------------------------------------------------------
  const hostInitiated = match.initiator_id === match.host_id;

  // Verify permission based on who started the connection
  const isHostDecider = !hostInitiated && user.id === match.host_id;
  const isGuestDecider = hostInitiated && user.id === match.guest_id;

  if (!isHostDecider && !isGuestDecider) {
    return NextResponse.json(
      { error: "You do not have permission to act on this connection request." },
      { status: 403 }
    );
  }

  // ---------------------------------------------------------------------------
  // UPDATE DECISION STATE
  // ---------------------------------------------------------------------------
  const { error } = await supabase
    .from("matches")
    .update({ status: decision })
    .eq("id", match.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ status: decision });
}