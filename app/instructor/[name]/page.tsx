import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Nav from "@/components/nav";
import type { Section } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function InstructorPage({
  params,
  searchParams,
}: {
  params: Promise<{ name: string }>;
  searchParams: Promise<{ term?: string }>;
}) {
  const { name: nameRaw } = await params;
  const { term: termFilter } = await searchParams;
  const name = decodeURIComponent(nameRaw).trim();
  if (!name) notFound();

  const supabase = await createClient();
  const [{ data: terms }, { data: rows }] = await Promise.all([
    supabase.from("terms").select("term_id, name").order("name"),
    supabase
      .from("sections")
      .select(
        "ccn, course_code, section_type, section_number, title, instructors, units, meeting_days, meeting_time, location, open_seats, term_id, subject_name",
      )
      .ilike("instructors", `%${name}%`)
      .order("course_code")
      .limit(500),
  ]);

  const termById = new Map((terms ?? []).map((t) => [t.term_id, t.name] as const));
  let sections = (rows ?? []) as Section[];

  // Optional term filter (defaults to most-recent if not set)
  const activeTerm = termFilter?.trim() ?? "";
  if (activeTerm) {
    sections = sections.filter((s) => termById.get(s.term_id ?? "") === activeTerm);
  }

  const distinctTerms = Array.from(
    new Set(sections.map((s) => termById.get(s.term_id ?? "")).filter(Boolean) as string[]),
  );
  const distinctSubjects = Array.from(new Set(sections.map((s) => s.subject_name).filter(Boolean) as string[]));
  const distinctCourses = Array.from(new Set(sections.map((s) => s.course_code).filter(Boolean) as string[]));

  // Group rows by course for clean display
  const byCourse = new Map<string, Section[]>();
  for (const s of sections) {
    const key = s.course_code ?? "(no course)";
    if (!byCourse.has(key)) byCourse.set(key, []);
    byCourse.get(key)!.push(s);
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <Nav />
      <section className="mx-auto max-w-5xl px-6 py-10">
        <Link href="/find" className="text-sm text-zinc-500 hover:text-zinc-300">
          ← Back to search
        </Link>

        <div className="mt-4 mb-6">
          <p className="text-zinc-500 text-sm uppercase tracking-wider">Instructor</p>
          <h1 className="text-3xl font-semibold">{name}</h1>
          <p className="text-zinc-400 mt-1">
            {sections.length} section{sections.length === 1 ? "" : "s"} · {distinctCourses.length}{" "}
            course{distinctCourses.length === 1 ? "" : "s"} · {distinctSubjects.length} subject
            {distinctSubjects.length === 1 ? "" : "s"}
            {activeTerm ? ` · ${activeTerm}` : ""}
          </p>
        </div>

        {distinctTerms.length > 1 && (
          <div className="mb-8 flex flex-wrap gap-2">
            <TermPill href={`/instructor/${encodeURIComponent(name)}`} active={!activeTerm}>
              All terms
            </TermPill>
            {distinctTerms.map((t) => (
              <TermPill
                key={t}
                href={`/instructor/${encodeURIComponent(name)}?term=${encodeURIComponent(t)}`}
                active={activeTerm === t}
              >
                {t}
              </TermPill>
            ))}
          </div>
        )}

        {sections.length === 0 ? (
          <div className="rounded-lg border border-dashed border-zinc-800 px-6 py-16 text-center">
            <p className="text-zinc-300">No sections found for {name}.</p>
            <p className="text-zinc-500 text-sm mt-1">
              Try searching just a last name, or pick a different term.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {[...byCourse.entries()].map(([course, items]) => (
              <div key={course} className="rounded-lg border border-zinc-900">
                <div className="border-b border-zinc-900 px-5 py-3 flex items-center justify-between">
                  <h2 className="font-semibold">{course}</h2>
                  <span className="text-xs text-zinc-500">
                    {items.length} section{items.length === 1 ? "" : "s"}
                  </span>
                </div>
                <table className="w-full text-sm">
                  <tbody>
                    {items.map((s) => (
                      <tr key={s.ccn} className="border-t border-zinc-900 first:border-t-0">
                        <td className="px-5 py-2 font-mono text-zinc-500 whitespace-nowrap">
                          <Link href={`/class/${s.ccn}`} className="hover:text-white">
                            {s.ccn}
                          </Link>
                        </td>
                        <td className="px-2 py-2 whitespace-nowrap text-zinc-300">
                          {s.section_type} {s.section_number}
                        </td>
                        <td className="px-2 py-2 max-w-xs truncate text-zinc-400">{s.title}</td>
                        <td className="px-2 py-2 whitespace-nowrap text-zinc-400">
                          {s.meeting_days ?? "—"}
                        </td>
                        <td className="px-2 py-2 whitespace-nowrap text-zinc-400">
                          {s.meeting_time ?? "async"}
                        </td>
                        <td className="px-5 py-2 text-right whitespace-nowrap">
                          <span
                            className={s.open_seats > 0 ? "text-green-400" : "text-zinc-500"}
                          >
                            {s.open_seats}
                          </span>
                          <span className="text-zinc-600 text-xs ml-1">open</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

function TermPill({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={
        "rounded-md px-3 py-1.5 text-xs font-medium transition-colors " +
        (active
          ? "bg-white text-black border border-white"
          : "bg-zinc-900 border border-zinc-800 text-zinc-300 hover:border-zinc-600")
      }
    >
      {children}
    </Link>
  );
}
