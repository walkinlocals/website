"use client";

import { useState } from "react";
import { Loader2, Flag } from "lucide-react";

interface Props {
  reportedUserId: string;
  reportedName: string;
}

export default function ReportUserButton({ reportedUserId, reportedName }: Props) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [state, setState] = useState<"idle" | "working" | "done" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (!reason.trim()) return;
    setState("working");
    setError(null);
    try {
      const res = await fetch("/api/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportedUserId, reason: reason.trim() }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Could not submit report.");
        setState("error");
        return;
      }
      setState("done");
    } catch {
      setError("Network error.");
      setState("error");
    }
  }

  if (state === "done") {
    return (
      <p className="text-xs font-mono uppercase tracking-wider text-emerald-700">
        Report submitted — our team will review.
      </p>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-slate-400 transition-colors hover:text-rose-600"
      >
        <Flag className="h-3.5 w-3.5" />
        Report member
      </button>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4 space-y-3">
      <p className="text-sm font-light text-slate-600">
        Report <strong>{reportedName}</strong> for violating our{" "}
        <a href="/terms" className="text-[#002FA7] hover:underline">
          code of conduct
        </a>
        .
      </p>
      <textarea
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        rows={3}
        placeholder="Describe what happened…"
        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-light resize-none focus:border-[#002FA7] focus:outline-none focus:ring-1 focus:ring-[#002FA7]"
      />
      {error && <p className="text-xs text-rose-600">{error}</p>}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={submit}
          disabled={state === "working" || !reason.trim()}
          className="inline-flex items-center gap-1.5 rounded-full bg-rose-600 px-4 py-2 text-[10px] font-mono font-semibold uppercase tracking-wider text-white disabled:opacity-50"
        >
          {state === "working" && <Loader2 className="h-3 w-3 animate-spin" />}
          Submit report
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-full border border-slate-200 px-4 py-2 text-[10px] font-mono uppercase tracking-wider text-slate-500"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
