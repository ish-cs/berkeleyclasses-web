import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import Nav from "@/components/nav";
import GradeHistogram from "@/components/grade-histogram";
import WaitlistTrend from "@/components/waitlist-trend";
import StarButton from "@/components/star-button";
import { extractPrereqs } from "@/lib/prereqs";
import type { CourseMeta, Section, SectionSnapshot } from "@/lib/types";

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
  const [{ data: siblings }, { data: metaRow }, { data: snapshotRows }] = await Promise.all([
    supabase
      .from("sections")
      .select("ccn, section_type, section_number, instructors, meeting_days, meeting_time, open_seats")
      .eq("course_code", s.course_code ?? "")
      .eq("term_id", s.term_id ?? "")
      .neq("ccn", ccnNum)
      .order("section_number")
      .limit(40),
    s.course_code
      ? supabase.from("course_meta").select("*").eq("course_code", s.course_code).maybeSingle()
      : Promise.resolve({ data: null }),
    supabase
      .from("section_snapshots")
      .select("ccn, taken_at, open_seats, enrolled, waitlisted, capacity")
      .eq("ccn", ccnNum)
      .order("taken_at", { ascending: true })
      .limit(200),
  ]);
  const meta = (metaRow ?? null) as CourseMeta | null;
  const snapshots = (snapshotRows ?? []) as SectionSnapshot[];
  const prereqs = extractPrereqs({
    metaText: meta?.prereq_text,
    requiredCourses: meta?.required_courses,
    description: s.description,
  });

  return (
    <main className="min-h-screen bg-black text-white">
      <Nav />
      <section className="mx-auto max-w-4xl px-4 sm:px-6 py-8 sm:py-10">
        <Link href="/find" className="text-sm text-zinc-500 hover:text-zinc-300">
          ← Back to search
        </Link>
        <div className="mt-4 flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-zinc-500 text-sm">
              CCN {s.ccn} ·{" "}
              {s.subject_name ? (
                <Link
                  href={`/dept/${encodeURIComponent(s.subject_name)}`}
                  className="hover:text-zinc-300"
                >
                  {s.subject_name}
                </Link>
              ) : (
                "—"
              )}
            </p>
            <h1 className="text-2xl sm:text-3xl font-semibold break-words">
              {s.course_code} {s.section_type} {s.section_number}
            </h1>
            <p className="text-lg sm:text-xl text-zinc-300 mt-1">{s.title}</p>
          </div>
          <div className="text-right flex items-start gap-3">
            <StarButton ccn={s.ccn} variant="icon" />
            <div>
              <p className={`text-3xl font-mono ${s.open_seats > 0 ? "text-green-400" : "text-zinc-500"}`}>
                {s.open_seats}
              </p>
              <p className="text-xs text-zinc-500">open seats</p>
            </div>
          </div>
        </div>

        {((meta?.requirements && meta.requirements.length > 0) || prereqs.text || prereqs.courses.length > 0) && (
          <div className="mt-5 flex flex-wrap gap-2 items-center">
            {(meta?.requirements ?? []).map((r) => (
              <Link
                key={r}
                href={`/find?reqs=${encodeURIComponent(r)}`}
                className="rounded-md bg-amber-500/10 border border-amber-500/40 text-amber-200 px-2.5 py-1 text-xs font-medium hover:bg-amber-500/20"
                title="Satisfies this UC Berkeley general requirement"
              >
                {r}
              </Link>
            ))}
            {prereqs.courses.map((c) => (
              <span
                key={`${c.subject} ${c.number}`}
                className="rounded-md bg-zinc-900 border border-zinc-800 px-2.5 py-1 text-xs text-zinc-200"
                title="Prerequisite"
              >
                <span className="text-zinc-500">prereq </span>
                <span className="font-mono">{c.subject} {c.number}</span>
              </span>
            ))}
          </div>
        )}
        {prereqs.text && prereqs.courses.length === 0 && (
          <p className="mt-3 text-sm text-zinc-400">
            <span className="text-zinc-500">Prereq: </span>
            {prereqs.text}
          </p>
        )}

        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8 text-sm">
          <div className="border-l-2 border-zinc-800 pl-3">
            <dt className="text-zinc-500 text-xs uppercase tracking-wide">Instructors</dt>
            <dd className="text-zinc-200 mt-0.5">
              {s.instructors
                ? s.instructors.split(/[;,]/).map((name, i, arr) => {
                    const trimmed = name.trim();
                    if (!trimmed) return null;
                    return (
                      <span key={trimmed + i}>
                        <Link
                          href={`/instructor/${encodeURIComponent(trimmed)}`}
                          className="hover:text-white underline decoration-zinc-700 hover:decoration-zinc-400 underline-offset-2"
                        >
                          {trimmed}
                        </Link>
                        {i < arr.length - 1 && trimmed && ", "}
                      </span>
                    );
                  })
                : "—"}
            </dd>
          </div>
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

        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          {meta?.grade_distribution && meta.grade_distribution.length > 0 && (
            <GradeHistogram
              distribution={meta.grade_distribution}
              average={meta.grade_average}
              sampleSize={meta.grade_sample_size}
            />
          )}
          <WaitlistTrend
            snapshots={snapshots}
            current={{ open_seats: s.open_seats, waitlisted: s.waitlisted, capacity: s.capacity }}
          />
        </div>

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
