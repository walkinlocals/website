const PING_KEY = "walkin_activity_ping";
const PING_INTERVAL_MS = 15 * 60 * 1000;

/** Throttled client-side activity heartbeat to keep last_activity_at fresh. */
export function pingActivity() {
  if (typeof window === "undefined") return;

  const lastPing = window.sessionStorage.getItem(PING_KEY);
  if (lastPing && Date.now() - Number(lastPing) < PING_INTERVAL_MS) return;

  window.sessionStorage.setItem(PING_KEY, String(Date.now()));
  void fetch("/api/activity/ping", { method: "POST" });
}
