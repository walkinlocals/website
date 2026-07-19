/** Days before sleep when we send a retention warning email. */
export const INACTIVITY_WARNING_DAYS = 80;

/** Days before an account is hidden from directories (sleep). */
export const INACTIVITY_SLEEP_DAYS = 90;

/** Total days of inactivity before permanent account deletion. */
export const INACTIVITY_DELETE_DAYS = 180;

export const INACTIVITY_NOTICE =
  `Accounts receive a warning at ${INACTIVITY_WARNING_DAYS} days of inactivity, sleep after ${INACTIVITY_SLEEP_DAYS} days, and are permanently deleted after ${INACTIVITY_DELETE_DAYS} days total inactivity. Log in or save your profile to stay active.`;
