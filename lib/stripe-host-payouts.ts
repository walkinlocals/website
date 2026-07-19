import type Stripe from "stripe";

/** Connected account can receive destination-charge transfers from the platform. */
export function hostCanReceiveDestinationCharges(account: Stripe.Account): boolean {
  const caps = account.capabilities;
  return caps?.transfers === "active" || caps?.legacy_payments === "active";
}

/** Host finished Connect onboarding and can be paid via destination charges. */
export function hostPayoutsReady(account: Stripe.Account): boolean {
  return hostCanReceiveDestinationCharges(account) && account.payouts_enabled === true;
}

export function transfersCapabilityStatus(account: Stripe.Account): string | undefined {
  return account.capabilities?.transfers;
}
