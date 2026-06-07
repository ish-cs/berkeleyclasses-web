import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Nav from "@/components/nav";
import ScheduleGrid from "@/components/schedule-grid";
import DeleteScheduleButton from "./delete-schedule-button";
import type { SavedSchedule, Section } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function SavedPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/signin?next=/saved");

  const { data: schedulesRaw } = await supabase
    .from("saved_schedules")
    .select("id, name, term_id, ccns, notes, created_at, updated_at, user_id")
    .order("updated_at", { ascending: false });

  const schedules = (schedulesRaw ?? []) as SavedSchedule[];

  const { data: starredRows } = await supabase
    .from("starred_sections")
    .select("ccn, created_at")
    .order("created_at", { ascending: false });
  const starredCcns = (starredRows ?? []).map((r) => r.ccn as number);

  const allCcns = Array.from(new Set([...schedules.flatMap((s) => s.ccns), ...starredCcns]));
  const { data: sectionRows } =
    allCcns.length === 0
      ? { data: [] as Section[] }
      : await supabase.from("sections").select("*").in("ccn", allCcns);
  const sectionsByCcn = new Map<number, Section>();
  (sectionRows ?? []).forEach((s) => sectionsByCcn.set(s.ccn, s as Section));
  const starredSections = starredCcns.map((c) => sectionsByCcn.get(c)).filter(Boolean) as Section[];

  return (
    <main className="min-h-screen bg-black text-white">
      <Nav />
      <section className="mx-auto max-w-5xl px-4 sm:px-6 py-10">
        <div className="flex items-center justify-between mb-2 gap-3 flex-wrap">
          <h1 className="text-3xl font-semibold">Saved</h1>
          <Link
            href="/schedule"
            className="rounded-md bg-white text-black px-4 py-2 text-sm font-medium hover:bg-zinc-200"
          >
            Build new →
          </Link>
        </div>
        <p className="text-zinc-500 mb-8">
          Signed in as <span className="text-zinc-300">{user.email}</span>
        </p>

        {starredSections.length > 0 && (
          <div className="mb-10">
            <h2 className="text-lg font-semibold mb-3">Starred classes</h2>
            <div className="rounded-lg border border-zinc-900 divide-y divide-zinc-900">
              {starredSections.map((s) => (
                <Link
                  key={s.ccn}
                  href={`/class/${s.ccn}`}
                  className="flex items-center justify-between px-4 py-3 hover:bg-zinc-950"
                >
                  <div className="min-w-0">
                    <div className="font-medium">
                      {s.course_code} {s.section_type} {s.section_number}
                    </div>
                    <div className="text-xs text-zinc-500 truncate">{s.title}</div>
                  </div>
                  <span className={`font-mono text-sm ${s.open_seats > 0 ? "text-green-400" : "text-zinc-500"}`}>
                    {s.open_seats} open
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}

        <h2 className="text-lg font-semibold mb-3">Schedules</h2>
        {schedules.length === 0 ? (
          <div className="rounded-lg border border-dashed border-zinc-800 px-6 py-10 text-center">
            <p className="text-zinc-400 mb-4">You haven&apos;t saved any schedules yet.</p>
            <Link
              href="/schedule"
              className="rounded-md bg-white text-black px-4 py-2 text-sm font-medium hover:bg-zinc-200"
            >
              Build one →
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {schedules.map((sched) => {
              const sections = sched.ccns
                .map((c) => sectionsByCcn.get(c))
                .filter(Boolean) as Section[];
              const ccns = sched.ccns.join(",");
              const icsName = sched.name || "schedule";
              return (
                <div key={sched.id} className="rounded-lg border border-zinc-900 p-5">
                  <div className="flex items-start justify-between mb-3 gap-3 flex-wrap">
                    <div className="min-w-0">
                      <h3 className="font-semibold truncate">{sched.name}</h3>
                      <p className="text-xs text-zinc-500">
                        Updated{" "}
                        {new Date(sched.updated_at).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}{" "}
                        · {sched.ccns.length} section{sched.ccns.length === 1 ? "" : "s"}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <a
                        href={`/api/ics?ccns=${ccns}&name=${encodeURIComponent(icsName)}`}
                        className="rounded-md border border-zinc-700 text-zinc-200 px-3 py-1.5 text-sm font-medium hover:border-zinc-500"
                      >
                        Export .ics
                      </a>
                      <DeleteScheduleButton id={sched.id} />
                    </div>
                  </div>
                  <ScheduleGrid sections={sections} />
                  <table className="w-full text-sm mt-4">
                    <tbody>
                      {sched.ccns.map((ccn) => {
                        const s = sectionsByCcn.get(ccn);
                        return (
                          <tr key={ccn} className="border-t border-zinc-900 first:border-t-0">
                            <td className="py-2 pr-4 font-mono text-zinc-500">
                              <Link href={`/class/${ccn}`} className="hover:text-white">
                                {ccn}
                              </Link>
                            </td>
                            <td className="py-2 pr-4 font-medium">
                              {s ? `${s.course_code} ${s.section_type} ${s.section_number}` : "(not synced)"}
                            </td>
                            <td className="py-2 pr-4 text-zinc-400">
                              {s?.meeting_days ?? "—"}
                            </td>
                            <td className="py-2 pr-4 text-zinc-400">
                              {s?.meeting_time ?? "async"}
                            </td>
                            <td className="py-2 text-zinc-500 truncate">{s?.instructors ?? ""}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
