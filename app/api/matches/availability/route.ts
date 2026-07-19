import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/** Booked dates for a host (Accepted or Paid visits). */
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
    .select("proposed_date")
    .eq("host_id", hostId)
    .in("status", ["Accepted", "Paid"])
    .not("proposed_date", "is", null);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const bookedDates = [
    ...new Set(
      (data ?? [])
        .map((row) => row.proposed_date as string | null)
        .filter((d): d is string => !!d),
    ),
  ];

  return NextResponse.json({ bookedDates });
}
