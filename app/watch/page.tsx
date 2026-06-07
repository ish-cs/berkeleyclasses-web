import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Nav from "@/components/nav";
import WatchForm from "./watch-form";
import UnsubscribeButton from "./unsubscribe-button";
import type { Section } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function WatchPage({
  searchParams,
}: {
  searchParams: Promise<{ ccn?: string }>;
}) {
  const { ccn } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect(`/auth/signin?next=${encodeURIComponent(`/watch${ccn ? `?ccn=${ccn}` : ""}`)}`);
  }

  const { data: subsRaw } = await supabase
    .from("watch_subscriptions")
    .select("id, ccn, email_on_open, created_at")
    .order("created_at", { ascending: false });

  const subs = subsRaw ?? [];
  const ccns = subs.map((s) => s.ccn);
  const { data: sectionRows } = ccns.length
    ? await supabase.from("sections").select("*").in("ccn", ccns)
    : { data: [] as Section[] };
  const sectionsByCcn = new Map<number, Section>();
  (sectionRows ?? []).forEach((s) => sectionsByCcn.set(s.ccn, s as Section));

  const preselectCcn = ccn ? parseInt(ccn, 10) : null;

  return (
    <main className="min-h-screen bg-black text-white">
      <Nav />
      <section className="mx-auto max-w-3xl px-6 py-10">
        <h1 className="text-3xl font-semibold mb-2">Waitlist watcher</h1>
        <p className="text-zinc-500 mb-8">
          Get an email when a section opens up or the waitlist shrinks. Powered by hourly snapshots.
        </p>

        <WatchForm initialCcn={preselectCcn ?? undefined} userEmail={user.email ?? ""} />

        <h2 className="text-lg font-semibold mt-12 mb-4">Your watched sections</h2>

        {subs.length === 0 ? (
          <p className="text-zinc-500">No active watches yet. Add a CCN above.</p>
        ) : (
          <ul className="divide-y divide-zinc-900 rounded-lg border border-zinc-900">
            {subs.map((sub) => {
              const s = sectionsByCcn.get(sub.ccn);
              return (
                <li key={sub.id} className="px-4 py-3 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <Link
                      href={`/class/${sub.ccn}`}
                      className="font-mono text-sm text-zinc-300 hover:text-white"
                    >
                      {sub.ccn}
                    </Link>{" "}
                    <span className="text-zinc-200">
                      {s ? `${s.course_code} ${s.section_type} ${s.section_number}` : "(not synced)"}
                    </span>
                    <p className="text-xs text-zinc-500 truncate">
                      {s?.title ?? ""}
                      {s ? ` · ${s.meeting_days ?? ""} ${s.meeting_time ?? ""}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={
                        "text-sm font-mono " +
                        (s && s.open_seats > 0 ? "text-green-400" : "text-zinc-500")
                      }
                    >
                      {s?.open_seats ?? "—"} open
                    </span>
                    <UnsubscribeButton id={sub.id} />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </main>
  );
}
