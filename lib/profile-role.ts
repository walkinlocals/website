import type { SupabaseClient } from "@supabase/supabase-js";

export type AppRole = "Guest" | "Host";

export function parseAppRole(value: unknown): AppRole | null {
  return value === "Guest" || value === "Host" ? value : null;
}

/** Fill in a missing profile role from auth metadata or a pending signup choice. */
export async function ensureProfileRole(
  supabase: SupabaseClient,
  userId: string,
  options: {
    profileRole?: string | null;
    metadataRole?: unknown;
    pendingRole?: string | null;
    forceRole?: AppRole | null;
  },
): Promise<AppRole | null> {
  const existing = parseAppRole(options.profileRole);
  if (existing) return existing;

  const resolved =
    options.forceRole ?? parseAppRole(options.metadataRole) ?? parseAppRole(options.pendingRole);
  if (!resolved) return null;

  const { error } = await supabase.from("profiles").update({ role: resolved }).eq("id", userId);
  if (error) throw error;

  return resolved;
}
