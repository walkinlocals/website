import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
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

  const { data: match } = await supabase
    .from("matches")
    .select("id, host_id, guest_id, status, initiator_id, date_confirmed, proposed_date")
    .eq("id", matchId)
    .single();

  if (!match) return NextResponse.json({ error: "Match not found." }, { status: 404 });
  if (match.status === "Paid") {
    return NextResponse.json({ error: "A paid connection can't be changed." }, { status: 409 });
  }

  const isParticipant = user.id === match.guest_id || user.id === match.host_id;
  if (!isParticipant) {
    return NextResponse.json({ error: "Permission denied." }, { status: 403 });
  }

  const hostInitiated = match.initiator_id === match.host_id;
  const isHostDecider = !hostInitiated && user.id === match.host_id;
  const isGuestDecider = hostInitiated && user.id === match.guest_id;
  const dateNotFinal = !match.date_confirmed || !match.proposed_date;

  if (decision === "Hold" && !isHostDecider && !isGuestDecider) {
    return NextResponse.json({ error: "Permission denied." }, { status: 403 });
  }
  if (decision === "Denied" && !dateNotFinal && !isHostDecider && !isGuestDecider) {
    return NextResponse.json({ error: "Permission denied." }, { status: 403 });
  }

  const { error } = await supabase
    .from("matches")
    .update({ status: decision })
    .eq("id", match.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  try {
    const targetUserId = isHostDecider ? match.guest_id : match.host_id;
    const { data: targetProfile } = await supabase
      .from("profiles")
      .select("contact_email, full_name")
      .eq("id", targetUserId)
      .single();

    if (targetProfile?.contact_email) {
      const isHold = decision === "Hold";
      await resend.emails.send({
        from: "WALKINLOCALS <updates@walkinlocals.com>",
        to: [targetProfile.contact_email],
        subject: isHold ? "⏳ Connection Update: On Hold" : "🛑 Connection Update: Declined",
        html: `
          <div style="font-family: serif; color: #0f172a; max-width: 600px; margin: 0 auto; padding: 20px;">
            <p style="font-family: monospace; font-size: 10px; text-transform: uppercase; letter-spacing: 0.2em; color: #002FA7;">WALKINLOCALS Notification</p>
            <h2 style="font-weight: normal; font-size: 24px; margin-top: 10px;">Update on your request</h2>
            <p style="font-size: 16px; font-weight: 300;">Hello ${targetProfile.full_name},</p>
            <p style="font-size: 16px; font-weight: 300; line-height: 1.6;">
              ${isHold
                ? "Your match request has been placed on hold by the other member while they verify their availability schedule."
                : "Unfortunately, the other member has declined the connection request at this time due to scheduling constraints."}
            </p>
          </div>
        `
      });
    }
  } catch (err) {
    console.error("Failed sending decision email notice:", err);
  }

  return NextResponse.json({ status: decision });
}