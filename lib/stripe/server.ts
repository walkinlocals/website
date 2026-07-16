import Stripe from "stripe";

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

/** The Walk In connection fee, in euro cents (€35.00). */
export const MATCH_FEE_CENTS = 3500;
