import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  INACTIVITY_DELETE_DAYS,
  INACTIVITY_SLEEP_DAYS,
  INACTIVITY_WARNING_DAYS,
} from "@/lib/inactivity";
import { appUrl, emailShell, sendEmail } from "@/lib/emails";

export interface InactivityJobResult {
  warned: number;
  slept: number;
  deleted: number;
}

function daysAgo(days: number): string {
  const cutoff = new Date();
  cutoff.setUTCDate(cutoff.getUTCDate() - days);
  return cutoff.toISOString();
}

export async function runInactivityJob(): Promise<InactivityJobResult> {
  const warningCutoff = daysAgo(INACTIVITY_WARNING_DAYS);
  const sleepCutoff = daysAgo(INACTIVITY_SLEEP_DAYS);
  const deleteCutoff = daysAgo(INACTIVITY_DELETE_DAYS);
  const baseUrl = appUrl();

  const { data: warnCandidates, error: warnSelectError } = await supabaseAdmin
    .from("profiles")
    .select("id, contact_email, full_name, last_activity_at")
    .eq("is_active", true)
    .is("inactivity_warning_sent_at", null)
    .lt("last_activity_at", warningCutoff)
    .gte("last_activity_at", sleepCutoff);

  if (warnSelectError) throw warnSelectError;

  let warned = 0;
  for (const profile of warnCandidates ?? []) {
    if (!profile.contact_email) continue;

    const result = await sendEmail({
      to: profile.contact_email,
      subject: "Your WALKINLOCALS profile is about to go to sleep",
      html: emailShell(
        "Stay active to remain visible",
        `
          <p style="font-size: 16px; font-weight: 300; line-height: 1.6;">
            Hello ${profile.full_name ?? "there"},
          </p>
          <p style="font-size: 16px; font-weight: 300; line-height: 1.6;">
            You have not visited WALKINLOCALS in over ${INACTIVITY_WARNING_DAYS} days.
            In ${INACTIVITY_SLEEP_DAYS - INACTIVITY_WARNING_DAYS} days your profile will be hidden from directories
            unless you sign in or save your profile.
          </p>
          <a href="${baseUrl}/profile" style="display: inline-block; background-color: #002FA7; color: white; padding: 12px 24px; text-decoration: none; border-radius: 9999px; font-weight: 600; margin-top: 15px;">
            Keep my profile active
          </a>
        `,
      ),
    });

    if (result.ok) {
      await supabaseAdmin
        .from("profiles")
        .update({ inactivity_warning_sent_at: new Date().toISOString() })
        .eq("id", profile.id);
      warned += 1;
    }
  }

  const { data: sleptRows, error: sleepError } = await supabaseAdmin
    .from("profiles")
    .update({ is_active: false })
    .lt("last_activity_at", sleepCutoff)
    .eq("is_active", true)
    .select("id");

  if (sleepError) throw sleepError;

  const { data: deleteCandidates, error: selectError } = await supabaseAdmin
    .from("profiles")
    .select("id")
    .lt("last_activity_at", deleteCutoff);

  if (selectError) throw selectError;

  let deleted = 0;
  for (const row of deleteCandidates ?? []) {
    const { error } = await supabaseAdmin.auth.admin.deleteUser(row.id);
    if (!error) deleted += 1;
  }

  return {
    warned,
    slept: sleptRows?.length ?? 0,
    deleted,
  };
}
