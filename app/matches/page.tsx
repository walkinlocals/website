import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import MatchesView, { type MatchRow } from "@/components/matches-view";
import { PAGE_BG_DOTS, PAGE_SHELL } from "@/lib/page-layout";

export const dynamic = "force-dynamic";

export default async function MatchesPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; connect?: string }>;
}) {
  const { success, connect } = await searchParams;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: me } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const { data: matches, error } = await supabase
    .from("matches")
    .select(
      `
      id, guest_id, host_id, status, stripe_link, party_size, initiator_id, created_at,
      proposed_date, proposed_time, date_proposed_by, date_confirmed,
      host:profiles!matches_host_id_fkey(id, full_name, avatar_url, neighborhood, origin_location, phone, contact_email, id_verified),
      guest:profiles!matches_guest_id_fkey(id, full_name, avatar_url, neighborhood, origin_location, phone, contact_email, id_verified)
      `,
    )
    .or(`guest_id.eq.${user.id},host_id.eq.${user.id}`)
    .order("created_at", { ascending: false });

  return (
    <div className={`${PAGE_SHELL} antialiased`}>
      <div className={PAGE_BG_DOTS} />
      <MatchesView
        currentUserId={user.id}
        myRole={(me?.role as "Guest" | "Host") ?? "Guest"}
        matches={(matches as unknown as MatchRow[]) ?? []}
        loadError={error?.message ?? null}
        justPaid={success === "true"}
        connectComplete={connect === "complete"}
      />
    </div>
  );
}