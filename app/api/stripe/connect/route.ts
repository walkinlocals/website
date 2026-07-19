import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe/server";
import { isAtLeast18FromDate } from "@/lib/profile";
import { resolveAppUrl } from "@/lib/app-url";
import { buildConnectAccountPayload } from "@/lib/stripe-connect-prefill";
import { transfersCapabilityStatus } from "@/lib/stripe-host-payouts";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  let returnPath = "/profile";
  try {
    const body = (await request.json().catch(() => null)) as { returnPath?: string } | null;
    if (body?.returnPath?.startsWith("/")) {
      returnPath = body.returnPath.split("?")[0] ?? body.returnPath;
    }
  } catch {
    // default return path
  }

  const connectReturnUrl = (status: "complete" | "refresh") =>
    `${appUrl}${returnPath}?connect=${status}`;

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select(
      "role, first_name, last_name, full_name, stripe_account_id, contact_email, phone, age_verified, date_of_birth",
    )
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    return NextResponse.json({ error: "Profile not found." }, { status: 404 });
  }

  if (profile.role !== "Host") {
    return NextResponse.json({ error: "Only hosts can set up payouts." }, { status: 403 });
  }

  if (!profile.age_verified && !isAtLeast18FromDate(profile.date_of_birth)) {
    return NextResponse.json(
      { error: "Add your date of birth to your profile before setting up payouts." },
      { status: 403 },
    );
  }

  const appUrl = resolveAppUrl(request);
  let accountId = profile.stripe_account_id;

  try {
    if (!accountId) {
      const account = await stripe.accounts.create({
        ...buildConnectAccountPayload(profile, user.email ?? undefined),
        metadata: { user_id: user.id },
      });
      accountId = account.id;

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ stripe_account_id: accountId })
        .eq("id", user.id);

      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 500 });
      }
    } else {
      const account = await stripe.accounts.retrieve(accountId);
      const transfers = transfersCapabilityStatus(account);
      if (transfers !== "active" && transfers !== "pending") {
        await stripe.accounts.update(accountId, {
          capabilities: {
            transfers: { requested: true },
          },
        });
      }
    }
    // Express accounts: Stripe does not allow updating email/individual after creation.
    // Prefill only happens on create above; returning users go straight to onboarding.

    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: connectReturnUrl("refresh"),
      return_url: connectReturnUrl("complete"),
      type: "account_onboarding",
    });

    if (!accountLink.url) {
      return NextResponse.json({ error: "Stripe did not return an onboarding URL." }, { status: 502 });
    }

    return NextResponse.json({ url: accountLink.url });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not start Stripe Connect onboarding." },
      { status: 502 },
    );
  }
}
