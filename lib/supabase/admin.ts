import { createClient } from "@supabase/supabase-js";

/**
 * Server-only Supabase client using the SERVICE ROLE key. This BYPASSES Row
 * Level Security, so it must never be imported into a Client Component or any
 * code that runs in the browser. Use it only in trusted server contexts like
 * webhooks, where there is no user session to act on behalf of.
 */
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  throw new Error(
    "Supabase admin client requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
  );
}

export const supabaseAdmin = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});
