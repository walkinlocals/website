/** Connection fee per person in euro cents (€35.00). */
export const MATCH_FEE_CENTS = 3500;

/** Host share per person in euro cents (€25.00). */
export const HOST_PAYOUT_CENTS = 2500;

/** Platform fee per person in euro cents (€10.00). */
export const PLATFORM_FEE_CENTS = MATCH_FEE_CENTS - HOST_PAYOUT_CENTS;

/** Maximum guests per connection request. */
export const MAX_PARTY_SIZE = 6;

/** Connection fee per person in euros (for display). */
export const MATCH_FEE_EUR = MATCH_FEE_CENTS / 100;

/** Host share per person in euros (for display). */
export const HOST_PAYOUT_EUR = HOST_PAYOUT_CENTS / 100;
