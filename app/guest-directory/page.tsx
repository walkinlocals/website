import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import DirectoryView from "@/components/directory-view";
import { fetchDirectoryProfiles, fetchDirectoryLiquidity } from "@/lib/directory";

export const dynamic = "force-dynamic";

export default async function GuestDirectoryPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: me } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (me?.role === "Guest") redirect("/host-directory");

  const [{ profiles, error }, liquidity] = await Promise.all([
    fetchDirectoryProfiles(supabase, "Guest", user.id),
    fetchDirectoryLiquidity(supabase),
  ]);

  return <DirectoryView role="Guest" profiles={profiles} liquidity={liquidity} error={error} />;
}
