import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import Nav from "@/components/nav";
import type { Section } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function ClassPage({
  params,
}: {
  params: Promise<{ ccn: string }>;
}) {
  const { ccn } = await params;
  const ccnNum = parseInt(ccn, 10);
  if (Number.isNaN(ccnNum) || ccnNum <= 0) notFound();

  const supabase = await createClient();
  const { data: section } = await supabase
    .from("sections")
    .select("*")
    .eq("ccn", ccnNum)
    .maybeSingle();
  if (!section) notFound();
  const s = section as Section;

  // Other sections of the same course
  const { data: siblings } = await supabase
    .from("sections")
    .select("ccn, section_type, section_number, instructors, meeting_days, meeting_time, open_seats")
    .eq("course_code", s.course_code ?? "")
    .eq("term_id", s.term_id ?? "")
    .neq("ccn", ccnNum)
    .order("section_number")
    .limit(40);

  return (
    <main className="min-h-screen bg-black text-white">
      <Nav />
      <section className="mx-auto max-w-4xl px-6 py-10">
        <Link href="/find" className="text-sm text-zinc-500 hover:text-zinc-300">
          ← Back to search
        </Link>
        <div className="mt-4 flex items-center justify-between">
          <div>
            <p className="text-zinc-500 text-sm">CCN {s.ccn} · {s.subject_name}</p>
            <h1 className="text-3xl font-semibold">
              {s.course_code} {s.section_type} {s.section_number}
            </h1>
            <p className="text-xl text-zinc-300 mt-1">{s.title}</p>
          </div>
          <div className="text-right">
            <p className={`text-3xl font-mono ${s.open_seats > 0 ? "text-green-400" : "text-zinc-500"}`}>
              {s.open_seats}
            </p>
            <p className="text-xs text-zinc-500">open seats</p>
          </div>
        </div>

        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8 text-sm">
          <Stat label="Instructors" value={s.instructors} />
          <Stat label="Units" value={s.units} />
          <Stat label="Meeting days" value={s.meeting_days} />
          <Stat label="Meeting time" value={s.meeting_time} />
          <Stat label="Location" value={s.location} />
          <Stat label="Mode" value={s.instruction_mode} />
          <Stat label="Dates" value={s.meeting_dates} />
          <Stat
            label="Enrollment"
            value={`${s.enrolled} / ${s.capacity}${s.waitlisted ? ` (${s.waitlisted} waitlisted)` : ""}`}
          />
        </dl>

        {s.description && (
          <div className="mt-10">
            <h2 className="text-lg font-semibold mb-2">Description</h2>
            <p className="text-zinc-300 whitespace-pre-wrap leading-relaxed">{s.description}</p>
          </div>
        )}

        {siblings && siblings.length > 0 && (
          <div className="mt-10">
            <h2 className="text-lg font-semibold mb-4">
              Other sections of {s.course_code}
            </h2>
            <div className="overflow-x-auto rounded-lg border border-zinc-900">
              <table className="w-full text-sm">
                <thead className="bg-zinc-950 text-zinc-400">
                  <tr>
                    <th className="text-left px-4 py-2">CCN</th>
                    <th className="text-left px-4 py-2">Type</th>
                    <th className="text-left px-4 py-2">Sec</th>
                    <th className="text-left px-4 py-2">Instructors</th>
                    <th className="text-left px-4 py-2">Days / Time</th>
                    <th className="text-right px-4 py-2">Open</th>
                  </tr>
                </thead>
                <tbody>
                  {siblings.map((sib) => (
                    <tr key={sib.ccn} className="border-t border-zinc-900 hover:bg-zinc-950">
                      <td className="px-4 py-2 font-mono">
                        <Link href={`/class/${sib.ccn}`} className="hover:text-white text-zinc-300">
                          {sib.ccn}
                        </Link>
                      </td>
                      <td className="px-4 py-2">{sib.section_type}</td>
                      <td className="px-4 py-2">{sib.section_number}</td>
                      <td className="px-4 py-2 max-w-xs truncate">{sib.instructors ?? ""}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-zinc-400">
                        {sib.meeting_days ?? "—"}
                        {sib.meeting_time ? ` · ${sib.meeting_time}` : ""}
                      </td>
                      <td className="px-4 py-2 text-right">
                        <span className={sib.open_seats > 0 ? "text-green-400" : "text-zinc-500"}>
                          {sib.open_seats}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="mt-10 flex gap-3">
          <Link
            href={`/compare?a=${s.ccn}`}
            className="rounded-md border border-zinc-700 px-4 py-2 text-sm font-medium hover:border-zinc-500"
          >
            Compare with another section →
          </Link>
          <Link
            href={`/watch?ccn=${s.ccn}`}
            className="rounded-md border border-zinc-700 px-4 py-2 text-sm font-medium hover:border-zinc-500"
          >
            Watch for open seats
          </Link>
        </div>
      </section>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string | number | null }) {
  return (
    <div className="border-l-2 border-zinc-800 pl-3">
      <dt className="text-zinc-500 text-xs uppercase tracking-wide">{label}</dt>
      <dd className="text-zinc-200 mt-0.5">{value || "—"}</dd>
    </div>
  );
}
