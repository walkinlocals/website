import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isValidProposedTime } from "@/lib/match-dates";

/** Booked date+time slots for a host (Accepted or Paid visits). */
export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const hostId = searchParams.get("hostId");
  if (!hostId) {
    return NextResponse.json({ error: "hostId is required." }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("matches")
    .select("proposed_date, proposed_time")
    .eq("host_id", hostId)
    .in("status", ["Accepted", "Paid"])
    .not("proposed_date", "is", null)
    .not("proposed_time", "is", null);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const bookedSlots = (data ?? [])
    .filter(
      (row): row is { proposed_date: string; proposed_time: string } =>
        !!row.proposed_date && !!row.proposed_time && isValidProposedTime(row.proposed_time),
    )
    .map((row) => ({
      date: row.proposed_date,
      time: row.proposed_time.length === 5 ? row.proposed_time : row.proposed_time.slice(0, 5),
    }));

  return NextResponse.json({ bookedSlots });
}
