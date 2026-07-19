import Stripe from "stripe";
import {
  MATCH_FEE_CENTS,
  HOST_PAYOUT_CENTS,
  PLATFORM_FEE_CENTS,
  MAX_PARTY_SIZE,
} from "@/lib/pricing";

export { MATCH_FEE_CENTS, HOST_PAYOUT_CENTS, PLATFORM_FEE_CENTS, MAX_PARTY_SIZE };

/**
 * Server-only Stripe client. Never import this from a Client Component —
 * STRIPE_SECRET_KEY must never reach the browser.
 */
const secretKey = process.env.STRIPE_SECRET_KEY;

if (!secretKey) {
  throw new Error(
    "STRIPE_SECRET_KEY is not set. Add it to .env.local before using Stripe.",
  );
}

export const stripe = new Stripe(secretKey);
