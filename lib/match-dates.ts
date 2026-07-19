export interface MatchDateFields {
  guest_id: string;
  host_id: string;
  initiator_id: string | null;
  proposed_date: string | null;
  date_proposed_by: string | null;
  date_confirmed: boolean | null;
}

export function formatVisitDate(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-IE", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function toDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function isValidProposedDate(dateStr: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false;
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  if (date.getFullYear() !== y || date.getMonth() !== m - 1 || date.getDate() !== d) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date >= today;
}

export function isDateNegotiationComplete(match: MatchDateFields): boolean {
  return match.date_confirmed === true && !!match.proposed_date;
}

/** Host invited guest — guest must pick the first date. */
export function guestMustProposeDate(match: MatchDateFields): boolean {
  return match.initiator_id === match.host_id && !match.proposed_date;
}

/** Someone proposed a date; the other party can accept or counter. */
export function canRespondToDateProposal(match: MatchDateFields, userId: string): boolean {
  return (
    !!match.proposed_date &&
    !!match.date_proposed_by &&
    match.date_proposed_by !== userId &&
    match.date_confirmed !== true
  );
}

/** Waiting on the other person after you proposed a date. */
export function isAwaitingDateResponse(match: MatchDateFields, userId: string): boolean {
  return (
    !!match.proposed_date &&
    match.date_proposed_by === userId &&
    match.date_confirmed !== true
  );
}

/** Host invited the guest — waiting for the guest to pick the first date. */
export function isHostWaitingForGuestDate(match: MatchDateFields, userId: string): boolean {
  return (
    guestMustProposeDate(match) &&
    userId === match.host_id
  );
}
