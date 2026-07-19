import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isValidProposedDate } from "@/lib/match-dates";
import { Resend } from "resend";
import { formatVisitDate } from "@/lib/match-dates";

const resend = new Resend(process.env.RESEND_API_KEY);

async function assertHostDateAvailable(
  supabase: Awaited<ReturnType<typeof createClient>>,
  hostId: string,
  proposedDate: string,
  excludeMatchId?: string,
) {
  let query = supabase
    .from("matches")
    .select("id")
    .eq("host_id", hostId)
    .eq("proposed_date", proposedDate)
    .in("status", ["Accepted", "Paid"]);

  if (excludeMatchId) {
    query = query.neq("id", excludeMatchId);
  }

  const { data: conflict, error } = await query.maybeSingle();
  if (error) {
    return { ok: false as const, status: 500, error: "Failed to verify host availability." };
  }
  if (conflict) {
    return {
      ok: false as const,
      status: 409,
      error: "This host is already booked on that date.",
    };
  }
  return { ok: true as const };
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  let body: { matchId?: string; action?: string; proposedDate?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { matchId, action, proposedDate } = body;
  if (!matchId || (action !== "propose" && action !== "accept")) {
    return NextResponse.json(
      { error: "matchId and action ('propose' | 'accept') are required." },
      { status: 400 },
    );
  }

  const { data: match } = await supabase
    .from("matches")
    .select(
      "id, guest_id, host_id, initiator_id, status, proposed_date, date_proposed_by, date_confirmed",
    )
    .eq("id", matchId)
    .single();

  if (!match) {
    return NextResponse.json({ error: "Match not found." }, { status: 404 });
  }
  if (user.id !== match.guest_id && user.id !== match.host_id) {
    return NextResponse.json({ error: "Permission denied." }, { status: 403 });
  }
  if (match.status === "Paid" || match.status === "Denied") {
    return NextResponse.json({ error: "This match can no longer be updated." }, { status: 409 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  if (action === "propose") {
    if (!proposedDate || !isValidProposedDate(proposedDate)) {
      return NextResponse.json({ error: "A valid future proposedDate is required." }, { status: 400 });
    }

    const hostInitiated = match.initiator_id === match.host_id;
    if (hostInitiated && !match.proposed_date && user.id !== match.guest_id) {
      return NextResponse.json(
        { error: "Only the guest can propose the first visit date for this invitation." },
        { status: 403 },
      );
    }
    if (match.proposed_date && match.date_proposed_by === user.id && !match.date_confirmed) {
      return NextResponse.json(
        { error: "Wait for the other person to respond to your date proposal." },
        { status: 409 },
      );
    }

    const availability = await assertHostDateAvailable(
      supabase,
      match.host_id,
      proposedDate,
      match.id,
    );
    if (!availability.ok) {
      return NextResponse.json({ error: availability.error }, { status: availability.status });
    }

    const { error } = await supabase
      .from("matches")
      .update({
        proposed_date: proposedDate,
        date_proposed_by: user.id,
        date_confirmed: false,
        status: "Pending",
      })
      .eq("id", match.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    try {
      const targetUserId = user.id === match.guest_id ? match.host_id : match.guest_id;
      const { data: targetProfile } = await supabase
        .from("profiles")
        .select("contact_email, full_name")
        .eq("id", targetUserId)
        .single();

      if (targetProfile?.contact_email) {
        await resend.emails.send({
          from: "WalkIn Locals <updates@walkinlocals.com>",
          to: [targetProfile.contact_email],
          subject: `📅 New date proposed: ${formatVisitDate(proposedDate)}`,
          html: `
            <div style="font-family: serif; color: #0f172a; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="font-weight: normal; font-size: 22px;">A visit date was proposed</h2>
              <p style="font-size: 16px; font-weight: 300;">Hello ${targetProfile.full_name},</p>
              <p style="font-size: 16px; font-weight: 300; line-height: 1.6;">
                <strong>${formatVisitDate(proposedDate)}</strong> has been suggested for your WalkIn Locals visit.
                Open Matches to accept it or suggest another date.
              </p>
              <a href="${appUrl}/matches" style="display: inline-block; margin-top: 20px; background: #002FA7; color: white; padding: 12px 24px; text-decoration: none; border-radius: 9999px;">Open Matches</a>
            </div>
          `,
        });
      }
    } catch (emailErr) {
      console.error("Date proposal email failed:", emailErr);
    }

    return NextResponse.json({ success: true, proposedDate, date_confirmed: false });
  }

  // accept
  if (!match.proposed_date) {
    return NextResponse.json({ error: "No date has been proposed yet." }, { status: 400 });
  }
  if (match.date_proposed_by === user.id) {
    return NextResponse.json({ error: "You cannot accept your own date proposal." }, { status: 403 });
  }
  if (match.date_confirmed) {
    return NextResponse.json({ success: true, date_confirmed: true, proposed_date: match.proposed_date });
  }

  const availability = await assertHostDateAvailable(
    supabase,
    match.host_id,
    match.proposed_date,
    match.id,
  );
  if (!availability.ok) {
    return NextResponse.json({ error: availability.error }, { status: availability.status });
  }

  const { error } = await supabase
    .from("matches")
    .update({ date_confirmed: true, status: "Pending" })
    .eq("id", match.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  try {
    const targetUserId = user.id === match.guest_id ? match.host_id : match.guest_id;
    const { data: targetProfile } = await supabase
      .from("profiles")
      .select("contact_email, full_name")
      .eq("id", targetUserId)
      .single();

    if (targetProfile?.contact_email) {
      await resend.emails.send({
        from: "WalkIn Locals <updates@walkinlocals.com>",
        to: [targetProfile.contact_email],
        subject: `✅ Visit date confirmed: ${formatVisitDate(match.proposed_date)}`,
        html: `
          <div style="font-family: serif; color: #0f172a; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="font-weight: normal; font-size: 22px;">Visit date confirmed</h2>
            <p style="font-size: 16px; font-weight: 300;">Hello ${targetProfile.full_name},</p>
            <p style="font-size: 16px; font-weight: 300; line-height: 1.6;">
              You agreed on <strong>${formatVisitDate(match.proposed_date)}</strong>.
              Head to Matches to continue with acceptance and payment.
            </p>
            <a href="${appUrl}/matches" style="display: inline-block; margin-top: 20px; background: #002FA7; color: white; padding: 12px 24px; text-decoration: none; border-radius: 9999px;">Open Matches</a>
          </div>
        `,
      });
    }
  } catch (emailErr) {
    console.error("Date accept email failed:", emailErr);
  }

  return NextResponse.json({
    success: true,
    date_confirmed: true,
    proposed_date: match.proposed_date,
  });
}
