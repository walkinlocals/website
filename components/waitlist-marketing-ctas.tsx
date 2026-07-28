"use client";

import { OpenWaitlistButton } from "@/components/open-waitlist-button";
import { homePrimaryButton, homeTextLink } from "@/lib/homepage-ui";

export function WaitlistPrimaryCta({
  role,
  label,
}: {
  role: "Host" | "Guest";
  label: string;
}) {
  return (
    <OpenWaitlistButton role={role} className={homePrimaryButton}>
      {label}
    </OpenWaitlistButton>
  );
}

export function WaitlistTextCta({
  role,
  label,
}: {
  role: "Host" | "Guest";
  label: string;
}) {
  return (
    <OpenWaitlistButton role={role} className={`inline-block ${homeTextLink}`}>
      {label}
    </OpenWaitlistButton>
  );
}
