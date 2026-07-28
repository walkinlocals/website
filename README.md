# Walk In

A curated marketplace connecting backpackers (**Guests**) with local Dublin hosts (**Hosts**)
for storytelling experiences over tea, coffee, and traditional treats.

Stack: **Next.js (App Router) · TypeScript · Tailwind CSS · Supabase (auth + DB + storage) ·
Stripe (Checkout + Identity) · Resend (email) · Google Maps**.

---

## Mental model

- **`page.tsx`** = a URL. `app/login/page.tsx` → `/login`. `app/profile/[id]/page.tsx` → `/profile/<id>`.
- **Server Components** (no `"use client"`) run on the server: load data, read auth cookies, do
  security checks.
- **Client Components** (`"use client"`) run in the browser: anything interactive (forms, buttons).
- **`route.ts`** under `app/api/` = a backend endpoint. Secrets live here.
- Common pattern: a **server page** loads data + guards access, then passes it to a **client
  "view" component** for interactivity.

---

## Files

### Config & entry
| File | Purpose |
|---|---|
| `app/layout.tsx` | App shell: Navbar + page content + footer, on every page. |
| `app/globals.css` | Loads Tailwind. |
| `.env.local` | All keys/secrets (gitignored). |
| `supabase/schema.sql` | DB blueprint — tables, enums, RLS, storage bucket. **Run manually in Supabase SQL editor.** |

### lib/ (plumbing)
| File | Purpose |
|---|---|
| `lib/supabase/client.ts` | Supabase client for the browser. |
| `lib/supabase/server.ts` | Supabase client for server (reads auth cookies). |
| `lib/supabase/admin.ts` | Service-role client (bypasses RLS). **Server-only** — used by the webhook. |
| `lib/stripe/server.ts` | Stripe SDK instance + `MATCH_FEE_CENTS` (€10). |
| `lib/dublin-neighborhoods.ts` | Neighbourhood → map coordinates lookup + `coarsen()` for privacy. |

### Pages
| File → URL | Purpose |
|---|---|
| `app/page.tsx` → `/` | Public homepage. |
| `app/login/page.tsx` → `/login` | Sign in + full sign-up onboarding + Google OAuth. |
| `app/profile/page.tsx` → `/profile` | Edit your own profile; reconciles OAuth role. |
| `app/profile/[id]/page.tsx` → `/profile/<id>` | View another user; privacy wall on contact info. |
| `app/host-directory/page.tsx` → `/host-directory` | Guest-only: host feed + map. |
| `app/guest-directory/page.tsx` → `/guest-directory` | Host-only: backpacker feed + privacy map. |
| `app/matches/page.tsx` → `/matches` | Match dashboard: pay when Accepted, banner on success. |

### API routes
| File → URL | Purpose |
|---|---|
| `app/api/matches/accept/route.ts` | Host accepts → creates €10 Stripe Checkout, sets `Accepted`. |
| `app/api/verify/create-session/route.ts` | Starts Stripe Identity verification. |
| `app/api/feedback/route.ts` | Emails contact-form message (Resend) + saves to DB. |
| `app/api/webhooks/stripe/route.ts` | Stripe callback: sets `id_verified` on verify, `Paid` on checkout. |

### Components
| File | Used by |
|---|---|
| `app/components/Navbar.tsx` | Every page (auth-aware nav). |
| `components/site-footer.tsx` | Site footer + contact modal. |
| `components/directory-view.tsx` | Host and guest directories. |
| `components/profile-actions.tsx` | Profile page (request/accept/verify buttons). |

---

## Data model (`profiles` + `matches`)

```
user_role   ENUM ('Guest','Host','Admin')
match_status ENUM ('Pending','Accepted','Denied','Paid')

profiles(id, full_name, role, neighborhood, bio, avatar_url,
         phone, contact_email, id_verified, stripe_verification_session_id)
matches(id, guest_id, host_id, status, stripe_link)
feedback(id, name, email, message, created_at)
storage bucket: avatars (public read, per-user write)
```

Key rules (enforced in RLS + code):
- You can only read/write your own `profiles` row.
- You only see `matches` you're part of.
- A match can only be created by a participant who is **`id_verified`** (verify-only-to-connect).
- Contact info (phone/email) unmasks on `/profile/[id]` **only when a `Paid` match exists** between
  the two users.

---

## Setup checklist (things not in code)

1. **Run `supabase/schema.sql`** in the Supabase SQL editor. Re-run when it changes.
2. **Email login**: turn **off** "Confirm email" (Supabase → Auth → Providers → Email) so
   onboarding completes in one step. (Leave on and users finish their profile after confirming.)
3. **Google OAuth**:
   - Supabase → Auth → Providers → Google: enable + paste Client ID **and Client Secret**.
   - Google Cloud Console → your OAuth client → Authorized redirect URIs:
     `https://<project>.supabase.co/auth/v1/callback`
   - Supabase → Auth → URL Configuration → Redirect URLs: add `http://localhost:3000/**` and
     your production origin (e.g. `https://yourdomain.com/auth/callback`).
4. **Google Maps**: enable **billing** on the Google Cloud project (maps won't render otherwise)
   + restrict the key by HTTP referrer.
5. **Stripe**:
   - Enable **Stripe Identity** (dashboard.stripe.com/identity).
   - Run `stripe listen --forward-to localhost:3000/api/webhooks/stripe`, copy the `whsec_…`
     into `STRIPE_WEBHOOK_SECRET` in `.env.local`.
6. **Resend**: create an account with `walkinlocals@gmail.com`, put the API key in
   `RESEND_API_KEY`. (Test sender only delivers to the account owner until you verify a domain.)

---

## Run it

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build / typecheck
```

---

## Known gaps / TODO

- **Avatar editing** only exists at signup — add an upload field to `/profile`.
- **Google signup** doesn't capture the full onboarding form (photo, bio…); OAuth users land on
  `/profile` with just a role to finish.
- **No middleware** for session refresh / global route protection (pages self-guard via redirects).
- **Neighbourhood gazetteer** is ~20 entries; unknown neighbourhoods get no map pin. Consider
  storing real `latitude`/`longitude`.
- **`Admin` role** is defined but unused.
- **Denied flow**: hosts can accept but there's no "Deny" action yet.
