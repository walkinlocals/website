"use client";

import type { ReactNode } from "react";
import { dispatchOpenWaitlistModal } from "@/components/waitlist-modal-provider";

type WaitlistRole = "Host" | "Guest";

export function OpenWaitlistButton({
  role,
  className,
  children,
}: {
  role: WaitlistRole;
  className?: string;
  children: ReactNode;
}) {
  return (
    <button type="button" className={className} onClick={() => dispatchOpenWaitlistModal(role)}>
      {children}
    </button>
  );
}
