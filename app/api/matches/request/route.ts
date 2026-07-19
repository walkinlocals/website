import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { resolveViewerCanConnect } from "@/lib/viewer-profile";
import { MAX_PARTY_SIZE } from "@/lib/stripe/server";
import { isValidProposedDate, formatVisitDate } from "@/lib/match-dates";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  let body: { guestId?: string; hostId?: string; partySize?: number; proposedDate?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { guestId, hostId, partySize, proposedDate } = body;

  if (!guestId || !hostId) {
    return NextResponse.json({ error: "guestId and hostId are required." }, { status: 400 });
  }

  const isGuestInitiator = user.id === guestId;
  const isHostInitiator = user.id === hostId;
  if (!isGuestInitiator && !isHostInitiator) {
    return NextResponse.json({ error: "You can only create requests you are part of." }, { status: 403 });
  }

  if (isGuestInitiator) {
    if (!proposedDate || !isValidProposedDate(proposedDate)) {
      return NextResponse.json(
        { error: "Guests must choose a visit date before requesting a host." },
        { status: 400 },
      );
    }
  } else if (proposedDate) {
    return NextResponse.json(
      { error: "Hosts send invitations without a date — the guest will propose one." },
      { status: 400 },
    );
  }

  const canConnect = await resolveViewerCanConnect(supabase, user.id);
  if (!canConnect) {
    return NextResponse.json(
      { error: "Complete and activate your profile before sending connection requests." },
      { status: 403 },
    );
  }

  if (proposedDate) {
    const { data: conflictingMatch, error: conflictError } = await supabase
      .from("matches")
      .select("id")
      .eq("host_id", hostId)
      .eq("proposed_date", proposedDate)
      .in("status", ["Accepted", "Paid"])
      .maybeSingle();

    if (conflictError) {
      return NextResponse.json({ error: "Failed to verify host availability." }, { status: 500 });
    }

    if (conflictingMatch) {
      return NextResponse.json(
        { error: "This host is already booked on that date. Pick another day." },
        { status: 409 },
      );
    }
  }

  const clampedPartySize = Math.min(Math.max(partySize ?? 1, 1), MAX_PARTY_SIZE);

  const insertPayload: Record<string, unknown> = {
    guest_id: guestId,
    host_id: hostId,
    initiator_id: user.id,
    status: "Pending",
    party_size: clampedPartySize,
    date_confirmed: false,
  };

  if (isGuestInitiator && proposedDate) {
    insertPayload.proposed_date = proposedDate;
    insertPayload.date_proposed_by = guestId;
  }

  const { data: match, error: insertError } = await supabase
    .from("matches")
    .insert(insertPayload)
    .select()
    .single();

  if (insertError) {
    if (insertError.code === "23505") {
      return NextResponse.json({ error: "A connection request already exists between these profiles." }, { status: 409 });
    }
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  try {
    const targetUserId = user.id === guestId ? hostId : guestId;
    const isGuestSender = user.id === guestId;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

    const [senderResult, recipientResult] = await Promise.all([
      supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle(),
      supabase.from("profiles").select("contact_email, full_name").eq("id", targetUserId).maybeSingle(),
    ]);

    const formattedDate = proposedDate ? formatVisitDate(proposedDate) : null;

    if (recipientResult.data?.contact_email) {
      await resend.emails.send({
        from: "WalkIn Locals <updates@walkinlocals.com>",
        to: [recipientResult.data.contact_email],
        subject: isGuestSender && formattedDate
          ? `💌 Visit request for ${formattedDate}`
          : "💌 New connection invitation",
        html: `
          <div style="font-family: serif; color: #0f172a; max-width: 600px; margin: 0 auto; padding: 20px;">
            <p style="font-family: monospace; font-size: 10px; text-transform: uppercase; letter-spacing: 0.2em; color: #002FA7;">WalkIn Locals Notification</p>
            <h2 style="font-weight: normal; font-size: 24px; margin-top: 10px;">
              ${isGuestSender ? "New visit request" : "New connection invitation"}
            </h2>
            <p style="font-size: 16px; line-height: 1.6; font-weight: 300;">Hello ${recipientResult.data.full_name},</p>
            <p style="font-size: 16px; line-height: 1.6; font-weight: 300;">
              <strong>${senderResult.data?.full_name || "A platform member"}</strong>
              ${isGuestSender && formattedDate
                ? ` has requested a visit on <strong style="color: #002FA7;">${formattedDate}</strong>.`
                : " has invited you to connect. Open Matches to propose a visit date."}
            </p>
            <div style="margin-top: 32px;">
              <a href="${appUrl}/matches" style="background-color: #002FA7; color: white; padding: 14px 28px; text-decoration: none; border-radius: 9999px; font-size: 14px; font-family: sans-serif; font-weight: 600;">Open Match Dashboard</a>
            </div>
          </div>
        `,
      });
    }
  } catch (emailErr) {
    console.error("New request email notification failed:", emailErr);
  }

  return NextResponse.json({ success: true, match });
}
