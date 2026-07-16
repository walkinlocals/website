import { NextResponse } from "next/server";
import { Resend } from "resend";
import { createClient } from "@/lib/supabase/server";

/**
 * POST /api/feedback
 * Body: { name?: string; email?: string; message: string }
 *
 * Emails the Walk In inbox via Resend AND stores the message in Supabase for a
 * durable record. If the email can't be sent, we say so rather than pretending
 * it went through.
 */
const CONTACT_INBOX = "walkinlocals@gmail.com";

export async function POST(request: Request) {
  let payload: { name?: string; email?: string; message?: string };
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const message = payload.message?.trim();
  if (!message) {
    return NextResponse.json({ error: "Message is required." }, { status: 400 });
  }
  const name = payload.name?.trim() || null;
  const email = payload.email?.trim() || null;

  // Durable record first (so nothing is lost even if email delivery fails).
  const supabase = await createClient();
  const { error: dbError } = await supabase
    .from("feedback")
    .insert({ name, email, message });

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      {
        error:
          "Message saved, but email is not configured (RESEND_API_KEY missing). Set it in .env.local.",
        stored: !dbError,
      },
      { status: 502 },
    );
  }

  try {
    const resend = new Resend(apiKey);
    const { error: sendError } = await resend.emails.send({
      // Until you verify your own domain in Resend, use the shared test sender.
      from: "Walk In <onboarding@resend.dev>",
      to: [CONTACT_INBOX],
      replyTo: email ?? undefined,
      subject: `New Walk In message${name ? ` from ${name}` : ""}`,
      text: [
        `Name: ${name ?? "(not given)"}`,
        `Email: ${email ?? "(not given)"}`,
        "",
        message,
      ].join("\n"),
    });

    if (sendError) {
      return NextResponse.json(
        { error: `Email failed: ${sendError.message}`, stored: !dbError },
        { status: 502 },
      );
    }
  } catch (err) {
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "Email failed to send.",
        stored: !dbError,
      },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true });
}
