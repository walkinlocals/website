import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  syncGuestAcceptedPayments,
  syncMatchPaymentFromStripe,
} from "@/lib/sync-match-payment";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  let matchId: string | undefined;
  try {
    const body = (await request.json()) as { matchId?: string };
    matchId = typeof body.matchId === "string" ? body.matchId : undefined;
  } catch {
    matchId = undefined;
  }

  if (matchId) {
    const result = await syncMatchPaymentFromStripe(matchId, user.id);
    return NextResponse.json(result);
  }

  const syncedCount = await syncGuestAcceptedPayments(user.id);
  return NextResponse.json({ synced: syncedCount > 0, syncedCount, status: "batch" });
}
