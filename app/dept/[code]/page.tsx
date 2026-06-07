import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Nav from "@/components/nav";
import type { Section } from "@/lib/types";
import { sortTermsByYear, isRealTerm } from "@/lib/terms";

export const dynamic = "force-dynamic";

const DEFAULT_TERM = "Fall 2026";

type CourseAgg = {
  course_code: string;
  section_count: number;
  open_seats: number;
  capacity: number;
  enrolled: number;
  sample_title: string;
};

export default async function DeptPage({
  params,
  searchParams,
}: {
  params: Promise<{ code: string }>;
  searchParams: Promise<{ term?: string }>;
}) {
  const { code: rawCode } = await params;
  const { term: termParam } = await searchParams;
  const code = decodeURIComponent(rawCode).trim();
  if (!code) notFound();
  const termName = termParam?.trim() || DEFAULT_TERM;

  const supabase = await createClient();
  const [{ data: termRow }, { data: terms }] = await Promise.all([
    supabase.from("terms").select("term_id, name").ilike("name", termName).maybeSingle(),
    supabase.from("terms").select("term_id, name"),
  ]);

  if (!termRow) {
    return (
      <main className="min-h-screen bg-black text-white">
        <Nav />
        <section className="mx-auto max-w-5xl px-6 py-10">
          <p className="text-zinc-400">Term &ldquo;{termName}&rdquo; not found.</p>
        </section>
      </main>
    );
  }

  const upper = code.toUpperCase();
  let { data: rows } = await supabase
    .from("sections")
    .select("*")
    .eq("term_id", termRow.term_id)
    .or(
      `subject_name.ilike.%${code}%,course_code.ilike.${upper} %,course_code.ilike.${upper}%`,
    )
    .order("course_code")
    .limit(2000);

  let sections = (rows ?? []) as Section[];

  if (sections.length === 0) {
    const fallback = await supabase
      .from("sections")
      .select("*")
      .eq("term_id", termRow.term_id)
      .ilike("subject_name", `%${code}%`)
      .limit(2000);
    sections = (fallback.data ?? []) as Section[];
  }

  if (sections.length === 0) notFound();

  // Aggregate
  const byCourse = new Map<string, CourseAgg>();
  const instructorCounts = new Map<string, number>();
  let totalOpen = 0;
  let totalCap = 0;
  let totalEnrolled = 0;
  for (const s of sections) {
    totalOpen += s.open_seats;
    totalCap += s.capacity;
    totalEnrolled += s.enrolled;
    const k = s.course_code ?? "(no code)";
    const agg = byCourse.get(k) ?? {
      course_code: k,
      section_count: 0,
      open_seats: 0,
      capacity: 0,
      enrolled: 0,
      sample_title: s.title ?? "",
    };
    agg.section_count += 1;
    agg.open_seats += s.open_seats;
    agg.capacity += s.capacity;
    agg.enrolled += s.enrolled;
    if (!agg.sample_title && s.title) agg.sample_title = s.title;
    byCourse.set(k, agg);

    if (s.instructors) {
      for (const part of s.instructors.split(/[;,]/)) {
        const name = part.trim();
        if (!name || /^(staff|tba)$/i.test(name)) continue;
        instructorCounts.set(name, (instructorCounts.get(name) ?? 0) + 1);
      }
    }
  }

  const topInstructors = [...instructorCounts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 8);

  const courses = [...byCourse.values()].sort((a, b) => a.course_code.localeCompare(b.course_code));

  const subjectName = sections[0].subject_name ?? code;

  return (
    <main className="min-h-screen bg-black text-white">
      <Nav />
      <section className="mx-auto max-w-5xl px-6 py-10">
        <Link href="/find" className="text-sm text-zinc-500 hover:text-zinc-300">
          ← Back to search
        </Link>

        <div className="mt-4 mb-6">
          <p className="text-zinc-500 text-sm uppercase tracking-wider">Department</p>
          <h1 className="text-3xl font-semibold">{subjectName}</h1>
          <p className="text-zinc-400 mt-1">
            {sections.length} sections · {courses.length} courses ·{" "}
            <span className={totalOpen > 0 ? "text-green-400" : "text-zinc-400"}>
              {totalOpen} open seats
            </span>
            {" · "}{termRow.name}
          </p>
        </div>

        <div className="flex flex-wrap gap-2 mb-8">
          {sortTermsByYear((terms ?? []).filter((t) => isRealTerm(t.name))).map((t) => (
            <Link
              key={t.term_id}
              href={`/dept/${encodeURIComponent(code)}?term=${encodeURIComponent(t.name)}`}
              className={
                "rounded-md px-3 py-1.5 text-xs font-medium transition-colors " +
                (t.name === termName
                  ? "bg-white text-black border border-white"
                  : "bg-zinc-900 border border-zinc-800 text-zinc-300 hover:border-zinc-600")
              }
            >
              {t.name}
            </Link>
          ))}
        </div>

        <div className="grid md:grid-cols-4 gap-4 mb-10">
          <Stat label="Sections" value={sections.length} />
          <Stat label="Courses" value={courses.length} />
          <Stat
            label="Open seats"
            value={totalOpen}
            valueClass={totalOpen > 0 ? "text-green-400" : ""}
          />
          <Stat
            label="Fill rate"
            value={totalCap > 0 ? `${Math.round((100 * totalEnrolled) / totalCap)}%` : "—"}
          />
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h2 className="text-lg font-semibold mb-3">Courses offered</h2>
            <div className="rounded-lg border border-zinc-900 divide-y divide-zinc-900">
              {courses.map((c) => (
                <Link
                  key={c.course_code}
                  href={`/find?term=${encodeURIComponent(termRow.name)}&q=${encodeURIComponent(c.course_code)}`}
                  className="block px-4 py-3 hover:bg-zinc-950/50"
                >
                  <div className="flex items-baseline justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium truncate">{c.course_code}</p>
                      <p className="text-xs text-zinc-500 truncate">{c.sample_title}</p>
                    </div>
                    <div className="text-right shrink-0 text-xs">
                      <p className="text-zinc-400">
                        {c.section_count} sec
                      </p>
                      <p
                        className={
                          c.open_seats > 0 ? "text-green-400" : "text-zinc-500"
                        }
                      >
                        {c.open_seats} open
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-3">Top instructors</h2>
            {topInstructors.length === 0 ? (
              <p className="text-zinc-500 text-sm">No instructors found in this term yet.</p>
            ) : (
              <ul className="rounded-lg border border-zinc-900 divide-y divide-zinc-900">
                {topInstructors.map(([name, count]) => (
                  <li key={name}>
                    <Link
                      href={`/instructor/${encodeURIComponent(name)}?term=${encodeURIComponent(termRow.name)}`}
                      className="flex items-center justify-between px-4 py-3 hover:bg-zinc-950/50"
                    >
                      <span className="text-zinc-200">{name}</span>
                      <span className="text-zinc-500 text-sm">
                        {count} section{count === 1 ? "" : "s"}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}

function Stat({
  label,
  value,
  valueClass = "",
}: {
  label: string;
  value: string | number;
  valueClass?: string;
}) {
  return (
    <div className="rounded-lg border border-zinc-900 px-4 py-3">
      <p className="text-xs uppercase tracking-wider text-zinc-500">{label}</p>
      <p className={`text-2xl font-semibold mt-1 ${valueClass}`}>{value}</p>
    </div>
  );
}
