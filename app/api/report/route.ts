import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { OPS_INBOX, emailShell, sendEmail } from "@/lib/emails";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  let body: { reportedUserId?: string; reason?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { reportedUserId, reason } = body;
  if (!reportedUserId || !reason?.trim()) {
    return NextResponse.json({ error: "reportedUserId and reason are required." }, { status: 400 });
  }

  if (reportedUserId === user.id) {
    return NextResponse.json({ error: "You cannot report yourself." }, { status: 400 });
  }

  const [{ data: reporter }, { data: reported }] = await Promise.all([
    supabase.from("profiles").select("full_name, contact_email").eq("id", user.id).single(),
    supabase.from("profiles").select("full_name, role, contact_email").eq("id", reportedUserId).single(),
  ]);

  if (!reported) {
    return NextResponse.json({ error: "Reported profile not found." }, { status: 404 });
  }

  const trimmedReason = reason.trim();

  const { error: insertError } = await supabase.from("feedback").insert({
    name: reporter?.full_name,
    email: reporter?.contact_email ?? user.email,
    message: `[COMMUNITY REPORT]
Reporter ID: ${user.id}
Reported user ID: ${reportedUserId}
Reported name: ${reported.full_name ?? "unknown"}
Reported role: ${reported.role ?? "unknown"}
Reason: ${trimmedReason}`,
  });

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  const result = await sendEmail({
    to: OPS_INBOX,
    subject: `Community report — ${reported.full_name ?? reportedUserId}`,
    replyTo: reporter?.contact_email ?? user.email ?? undefined,
    html: emailShell(
      "Community conduct report",
      `
        <p style="font-size: 16px; font-weight: 300; line-height: 1.6;">
          A member has reported another user for review under the WalkIn Locals Code of Conduct.
        </p>
        <div style="background-color: #f8fafc; border-radius: 16px; padding: 20px; margin: 20px 0; font-family: monospace; font-size: 13px;">
          <p style="margin: 0 0 8px;"><strong>Reporter:</strong> ${reporter?.full_name ?? user.id}</p>
          <p style="margin: 0 0 8px;"><strong>Reported:</strong> ${reported.full_name ?? reportedUserId} (${reported.role ?? "—"})</p>
          <p style="margin: 0;"><strong>Reason:</strong> ${trimmedReason}</p>
        </div>
        <p style="font-size: 14px; font-weight: 300; line-height: 1.6;">
          Investigate and offboard via Supabase if needed (<code>delete_self_user</code> RPC or admin delete).
        </p>
      `,
    ),
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
