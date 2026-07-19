import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { OPS_INBOX, appUrl, emailShell, sendEmail } from "@/lib/emails";

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, full_name, contact_email, role, id_verified, stripe_verification_session_id")
    .eq("id", user.id)
    .single();

  if (error || !profile) {
    return NextResponse.json({ error: "Profile not found." }, { status: 404 });
  }

  if (profile.id_verified) {
    return NextResponse.json({ error: "Your identity is already verified." }, { status: 409 });
  }

  const { error: insertError } = await supabase.from("feedback").insert({
    name: profile.full_name,
    email: profile.contact_email ?? user.email,
    message: `[MANUAL ID REVIEW REQUEST]
User ID: ${profile.id}
Role: ${profile.role ?? "unknown"}
Stripe session: ${profile.stripe_verification_session_id ?? "none"}
Please review uploaded documents in the Stripe Identity dashboard and mark this user verified if appropriate.`,
  });

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  const result = await sendEmail({
    to: OPS_INBOX,
    subject: `Manual ID review requested — ${profile.full_name ?? profile.id}`,
    replyTo: profile.contact_email ?? user.email ?? undefined,
    html: emailShell(
      "Manual identity review requested",
      `
        <p style="font-size: 16px; font-weight: 300; line-height: 1.6;">
          A user could not complete automated Stripe Identity verification and has requested a manual review.
        </p>
        <div style="background-color: #f8fafc; border-radius: 16px; padding: 20px; margin: 20px 0; font-family: monospace; font-size: 13px;">
          <p style="margin: 0 0 8px;"><strong>Name:</strong> ${profile.full_name ?? "—"}</p>
          <p style="margin: 0 0 8px;"><strong>Email:</strong> ${profile.contact_email ?? user.email ?? "—"}</p>
          <p style="margin: 0 0 8px;"><strong>User ID:</strong> ${profile.id}</p>
          <p style="margin: 0 0 8px;"><strong>Role:</strong> ${profile.role ?? "—"}</p>
          <p style="margin: 0;"><strong>Stripe session:</strong> ${profile.stripe_verification_session_id ?? "none"}</p>
        </div>
        <p style="font-size: 14px; font-weight: 300; line-height: 1.6;">
          Review in the Stripe Identity dashboard. If approved, set <code>id_verified = true</code> on their profile in Supabase.
        </p>
        <a href="${appUrl()}/profile" style="display: inline-block; background-color: #002FA7; color: white; padding: 12px 24px; text-decoration: none; border-radius: 9999px; font-weight: 600; margin-top: 10px;">
          Open app
        </a>
      `,
    ),
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
