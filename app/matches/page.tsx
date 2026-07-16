import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import MatchesView, { type MatchRow } from "@/components/matches-view";

export default async function MatchesPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string }>;
}) {
  const { success } = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: me } = await supabase
    .from("profiles")
    .select("role, is_active")
    .eq("id", user.id)
    .single();

  if (!me?.is_active) redirect("/profile");

  const { data: matches, error } = await supabase
    .from("matches")
    .select(
      `
      id, guest_id, host_id, status, stripe_link, party_size, initiator_id, created_at,
      host:profiles!matches_host_id_fkey(id, full_name, avatar_url, neighborhood, origin_location, phone, contact_email),
      guest:profiles!matches_guest_id_fkey(id, full_name, avatar_url, neighborhood, origin_location, phone, contact_email)
      `,
    )
    .or(`guest_id.eq.${user.id},host_id.eq.${user.id}`)
    .order("created_at", { ascending: false });

  return (
    <div
      className="relative min-h-screen antialiased selection:bg-[#002FA7] selection:text-white overflow-hidden"
      style={{ backgroundColor: "#ffffff" }}
    >
      {/* Brand micro-dots pattern seamlessly aligned with the rest of the application */}
      <div className="pointer-events-none absolute inset-0 z-0 opacity-30 bg-[radial-gradient(#002fa709_1.5px,transparent_1.5px)] [background-size:32px_32px]" />

      <div className="relative z-10">
        <MatchesView
          currentUserId={user.id}
          myRole={(me.role as "Guest" | "Host") ?? "Guest"}
          matches={(matches as unknown as MatchRow[]) ?? []}
          loadError={error?.message ?? null}
          justPaid={success === "true"}
        />
      </div>
    </div>
  );
}