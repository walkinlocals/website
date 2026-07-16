import { redirect } from "next/navigation";
import Link from "next/link";
import { MapPin, Clock } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

function formatLastActivity(timestamp: string | null): string {
  if (!timestamp) return "Awhile ago";

  const lastActiveDate = new Date(timestamp);
  const currentDate = new Date();

  const diffTime = Math.abs(currentDate.getTime() - lastActiveDate.getTime());
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    if (diffHours === 0) {
      return "Active just now";
    }
    return `Active ${diffHours}h ago`;
  }
  if (diffDays === 1) return "Active yesterday";
  if (diffDays < 7) return `Active ${diffDays} days ago`;

  const diffWeeks = Math.floor(diffDays / 7);
  if (diffWeeks === 1) return "Active last week";
  return `Active ${diffWeeks} weeks ago`;
}

export default async function GuestDirectoryPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [meResult, guestsResult] = await Promise.all([
    supabase
      .from("profiles")
      .select("role, is_active")
      .eq("id", user.id)
      .single(),
    supabase
      .from("profiles")
      .select("id, full_name, origin_location, bio, avatar_url, last_activity_at")
      .eq("role", "Guest")
      .eq("is_active", true)
  ]);

  const me = meResult.data;
  const guests = guestsResult.data;

  if (!me?.is_active) redirect("/profile");
  if (me.role === "Guest") redirect("/host-directory");

  const list = guests ?? [];

  return (
    <div className="relative min-h-screen bg-white antialiased selection:bg-[#002FA7] selection:text-white overflow-hidden">
      {/* Matching gentle, modern blue-tinted micro-dots from the Login Page */}
      <div className="pointer-events-none absolute inset-0 z-0 opacity-30 bg-[radial-gradient(#002fa709_1.5px,transparent_1.5px)] [background-size:32px_32px]" />

      <main className="relative z-10 mx-auto max-w-6xl px-6 py-14 text-slate-900 sm:py-20">

        {/* Header Section */}
        <section className="relative mb-12 border-b border-slate-100 pb-12">
          <span className="inline-flex items-center gap-1 font-mono text-[9px] uppercase tracking-[0.3em] text-[#002FA7] font-semibold bg-[#002fa7]/5 px-3 py-1 rounded-full">
            ✦ WalkIn Locals ✦
          </span>
          <h1 className="mt-4 font-serif text-4xl font-normal tracking-tight text-slate-950 sm:text-6xl">
            Travelers in <span className="italic text-[#002FA7]">Dublin</span>
          </h1>
          <p className="mt-4 max-w-2xl text-base font-light leading-relaxed text-slate-500 sm:text-lg">
            Meet travelers hoping for an authentic afternoon. Click a traveler&apos;s card to read their story, see their journey, and welcome them in.
          </p>
        </section>

        {list.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 p-12 text-center bg-slate-50/50">
            <p className="font-serif text-lg italic text-slate-500">
              No travelers are looking right now — check back soon.
            </p>
          </div>
        ) : (
          /* Cards Grid */
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {list.map((g) => (
              <Link
                key={g.id}
                href={`/profile/${g.id}`}
                className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_4px_15px_rgba(0,47,167,0.01)] transition-all duration-500 hover:border-[#002FA7]/30 hover:bg-[#002fa7]/[0.01] hover:shadow-[0_15px_45px_rgba(0,47,167,0.03)]"
              >
                <div>
                  <div className="flex items-start gap-4">
                    <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-full border border-slate-150 bg-slate-50">
                      {g.avatar_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={g.avatar_url}
                          alt={g.full_name ?? "Traveler"}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-xl font-light text-slate-400">
                          {g.full_name?.charAt(0) ?? "?"}
                        </div>
                      )}
                    </div>

                    <div className="space-y-1">
                      <h2 className="font-serif text-xl font-normal text-slate-950 transition-colors duration-300 group-hover:text-[#002FA7]">
                        {g.full_name ?? "Traveler"}
                      </h2>

                      <div className="flex flex-col gap-0.5">
                        {g.origin_location && (
                          <p className="flex items-center gap-1 font-mono text-[9px] uppercase tracking-wider text-slate-400">
                            <MapPin className="h-3 w-3 text-[#002FA7]/70" />
                            From {g.origin_location}
                          </p>
                        )}
                        <p className="flex items-center gap-1 font-mono text-[8px] tracking-normal text-slate-400/60">
                          <Clock className="h-2 w-2 text-slate-300 group-hover:text-[#002FA7]/40 transition-colors duration-300" />
                          <span>{formatLastActivity(g.last_activity_at)}</span>
                        </p>
                      </div>
                    </div>
                  </div>

                  {g.bio && (
                    <p className="mt-4 line-clamp-3 text-sm font-light leading-relaxed text-slate-500 transition-colors duration-300 group-hover:text-slate-700">
                      {g.bio}
                    </p>
                  )}
                </div>

                <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4">
                  <span className="font-mono text-[10px] font-semibold uppercase tracking-widest text-[#002FA7] transition-colors duration-300 group-hover:text-slate-950">
                    View profile
                  </span>
                  <span className="font-mono text-xs text-slate-300 transition-transform duration-300 group-hover:translate-x-1 group-hover:text-[#002FA7]">
                    →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}