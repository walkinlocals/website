# WalkIn Locals — Launch Checklist

How to use this: tick items off as you go. Items marked **[DONE]** were already
completed in this session. Everything else needs your action — instructions are
inline. Nothing here requires spending real money; Stripe test mode (see the
"Testing" section) covers almost everything for free.

---

## 🔴 Must-do before going live

### Domain & environment
- [ ] **Point your real domain at Vercel.** Vercel → Project → Settings →
      Domains → add your domain, follow their DNS instructions.
- [ ] **Update `NEXT_PUBLIC_APP_URL`** to your real domain in two places:
      - Locally: `.env.local`
      - Vercel: Project → Settings → Environment Variables (this is the one that
        actually matters for production — `.env.local` never leaves your machine)
- [ ] **Add every env var to Vercel's dashboard** (Project → Settings →
      Environment Variables): `NEXT_PUBLIC_SUPABASE_URL`,
      `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`,
      `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `RESEND_API_KEY`,
      `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`, `NEXT_PUBLIC_BUSINESS_WHATSAPP`.
      Scope Stripe keys to **Production only** — see the Testing section below
      for why.
- [ ] **Switch Vercel's production branch from `waitlist` to `main`** when
      you're ready to cut over (Project → Settings → Git → Production Branch).

### Stripe
- [ ] **Get live Stripe keys** (Stripe Dashboard → toggle out of test mode →
      Developers → API keys). Add them to Vercel under the **Production**
      environment scope only (keep test keys for Preview/Development).
- [ ] **Re-point the webhook** to your production URL: Stripe Dashboard →
      Developers → Webhooks → add endpoint → `https://yourdomain.com/api/webhooks/stripe`
      → copy the new signing secret into `STRIPE_WEBHOOK_SECRET` (Production scope).
- [ ] **Run the Terms page through Stripe's policy checklist** or a tool like
      TermsFeed/iubenda before applying to go live with Stripe, to make sure
      the wording matches what their compliance review expects.
- [ ] **Add your real registered business name and address** to
      `app/terms/page.tsx` (section 1) — I left this as "an unincorporated
      partnership operating WalkIn Locals" since I don't have your actual
      registration details. Replace with the real legal entity name/address
      once you have it.
- [ ] **Confirm Stripe Connect (host payouts) and Stripe Identity
      (verification) both work in live mode** — test mode passing doesn't
      guarantee live mode is configured identically (e.g. Connect account
      capabilities can differ).

### Legal
- [x] **[DONE]** Standalone Privacy Policy page added at `/privacy`
      (covers what's collected, why, who it's shared with, retention,
      and GDPR rights). Linked from the footer and included in the sitemap.
- [x] **[DONE]** Terms page rewritten in standard professional language,
      including an explicit Cancellations & Refunds section (§4).
- [ ] **Solicitor review** — not a legal requirement to launch, but get one
      once revenue is steady, per your own risk assessment.

---

## 🟡 Testing (all free, in Stripe test mode)

- [ ] **Full manual walkthrough**: sign up → Stripe Identity verification
      (test mode simulates approve/decline) → host/guest match → payment
      (test card `4242 4242 4242 4242`, any future expiry, any CVC) → chat →
      simulate a Host-cancels refund request.
- [ ] **Install the Stripe CLI** to test webhooks locally:
      `stripe listen --forward-to localhost:3000/api/webhooks/stripe`
      (webhooks can't reach `localhost` directly from Stripe's servers otherwise).
- [ ] **Confirm Resend actually delivers** — point it at a real inbox you
      control and send yourself a test contact-form message.
- [ ] **Test WhatsApp deep links** on an actual phone (the "message us on
      WhatsApp" links only make sense on a device with WhatsApp installed).
- [ ] **Test on a couple of real devices** (not just this session's browser
      checks), especially iOS Safari, which handles some CSS differently.

---

## 🟢 Ops — decisions, not code

- [ ] **Decide who monitors `walkinlocals@gmail.com`** and knows how to
      process a refund manually from the Stripe dashboard — there's no
      self-service refund button in the product yet, only the policy.
- [ ] **Decide who reviews reported users** — the report button exists and
      stores reports, but nothing currently alerts a human to act on them.
- [ ] **Confirm your Vercel plan supports the cron job** in `vercel.json`
      (daily inactivity cleanup) — Hobby supports daily; more frequent
      schedules need Pro.

---

## ⚪ Nice-to-have, not blocking

- [x] **[DONE]** Vercel Analytics installed (`@vercel/analytics`) — you'll
      see visitor data in Vercel's dashboard once deployed. Free on all plans.
- [ ] **Submit the sitemap to Google Search Console** once the real domain
      is live (Search Console → Sitemaps → submit `https://yourdomain.com/sitemap.xml`).
      The verification meta tag is already in place in `app/layout.tsx`.

---

## What I can't do for you
Anything requiring your actual business facts (registered address, Stripe
business verification), access to your accounts (Vercel dashboard, Stripe
dashboard, Google Search Console, your email inbox), or a physical device —
those need you. Everything else in the checked-off items above, and any
further code changes, I can keep doing on request.
