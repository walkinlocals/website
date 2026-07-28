import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export const OPS_INBOX = process.env.OPS_EMAIL ?? "walkinlocals@gmail.com";

export function appUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

export function emailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

interface SendEmailInput {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
  replyTo?: string;
}

export async function sendEmail({
  to,
  subject,
  html,
  from = "WALKINLOCALS <updates@walkinlocals.com>",
  replyTo,
}: SendEmailInput): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!emailConfigured()) {
    return { ok: false, error: "RESEND_API_KEY is not configured." };
  }

  const { error } = await resend.emails.send({
    from,
    to: Array.isArray(to) ? to : [to],
    subject,
    html,
    replyTo,
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  return { ok: true };
}

export function emailShell(title: string, body: string): string {
  return `
    <div style="font-family: serif; color: #0f172a; max-width: 600px; margin: 0 auto; padding: 20px;">
      <p style="font-family: monospace; font-size: 10px; text-transform: uppercase; letter-spacing: 0.2em; color: #002FA7;">WALKINLOCALS</p>
      <h2 style="font-weight: normal; font-size: 24px; margin-top: 10px;">${title}</h2>
      ${body}
    </div>
  `;
}
