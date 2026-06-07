import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import Nav from "@/components/nav";
import type { Section } from "@/lib/types";

export const dynamic = "force-dynamic";

type SearchParams = {
  q?: string;
  subject?: string;
  open?: string;
  term?: string;
};

const DEFAULT_TERM = "Fall 2026";

export default async function FindPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const q = params.q?.trim() ?? "";
  const subject = params.subject?.trim() ?? "";
  const openOnly = params.open === "1";
  const termName = params.term?.trim() || DEFAULT_TERM;

  const supabase = await createClient();

  const { data: termRow } = await supabase
    .from("terms")
    .select("term_id, name")
    .ilike("name", termName)
    .maybeSingle();
  const termId = termRow?.term_id ?? null;

  const { data: subjects } = await supabase
    .from("subjects")
    .select("subject_id, name")
    .order("name");

  let query = supabase
    .from("sections")
    .select(
      "ccn, course_code, section_type, section_number, title, instructors, meeting_days, meeting_time, location, open_seats, capacity, subject_name",
    )
    .order("course_code")
    .limit(200);

  if (termId) query = query.eq("term_id", termId);
  if (subject) query = query.ilike("subject_name", `%${subject}%`);
  if (openOnly) query = query.gt("open_seats", 0);
  if (q) {
    const esc = q.replace(/,/g, " ");
    query = query.or(
      `course_code.ilike.%${esc}%,title.ilike.%${esc}%,instructors.ilike.%${esc}%`,
    );
  }

  const { data: rows, error } = await query;
  const sections: Section[] = (rows ?? []) as Section[];

  return (
    <main className="min-h-screen bg-black text-white">
      <Nav />
      <section className="mx-auto max-w-6xl px-6 py-10">
        <h1 className="text-3xl font-semibold mb-6">Search</h1>

        <form className="grid gap-3 md:grid-cols-12 mb-8" method="get">
          <input
            type="text"
            name="q"
            defaultValue={q}
            placeholder="Course code, title, or instructor (e.g. CS 61A, DeNero)"
            className="md:col-span-6 rounded-md bg-zinc-900 border border-zinc-800 px-3 py-2 outline-none focus:border-zinc-500"
          />
          <select
            name="subject"
            defaultValue={subject}
            className="md:col-span-4 rounded-md bg-zinc-900 border border-zinc-800 px-3 py-2 outline-none focus:border-zinc-500"
          >
            <option value="">All subjects</option>
            {subjects?.map((s) => (
              <option key={s.subject_id} value={s.name}>
                {s.name}
              </option>
            ))}
          </select>
          <label className="md:col-span-2 flex items-center gap-2 text-sm text-zinc-400">
            <input
              type="checkbox"
              name="open"
              value="1"
              defaultChecked={openOnly}
              className="accent-white"
            />
            Open only
          </label>
          <input type="hidden" name="term" value={termName} />
          <button
            type="submit"
            className="md:col-span-2 md:col-start-11 rounded-md bg-white text-black px-4 py-2 font-medium hover:bg-zinc-200"
          >
            Search
          </button>
        </form>

        {error && <p className="text-red-400 text-sm mb-4">{error.message}</p>}

        <p className="text-sm text-zinc-500 mb-4">
          {sections.length} result{sections.length === 1 ? "" : "s"} · term: {termName}
        </p>

        <div className="overflow-x-auto rounded-lg border border-zinc-900">
          <table className="w-full text-sm">
            <thead className="bg-zinc-950 text-zinc-400">
              <tr>
                <th className="text-left px-4 py-2">CCN</th>
                <th className="text-left px-4 py-2">Course</th>
                <th className="text-left px-4 py-2">Title</th>
                <th className="text-left px-4 py-2">Instructors</th>
                <th className="text-left px-4 py-2">Days / Time</th>
                <th className="text-right px-4 py-2">Open</th>
              </tr>
            </thead>
            <tbody>
              {sections.map((s) => (
                <tr key={s.ccn} className="border-t border-zinc-900 hover:bg-zinc-950">
                  <td className="px-4 py-2 font-mono">
                    <Link href={`/class/${s.ccn}`} className="hover:text-white text-zinc-300">
                      {s.ccn}
                    </Link>
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap">
                    {s.course_code} {s.section_type} {s.section_number}
                  </td>
                  <td className="px-4 py-2 max-w-xs truncate">{s.title}</td>
                  <td className="px-4 py-2 max-w-xs truncate">{s.instructors ?? ""}</td>
                  <td className="px-4 py-2 whitespace-nowrap text-zinc-400">
                    {s.meeting_days ?? "—"}
                    {s.meeting_time ? ` · ${s.meeting_time}` : ""}
                  </td>
                  <td className="px-4 py-2 text-right">
                    <span className={s.open_seats > 0 ? "text-green-400" : "text-zinc-500"}>
                      {s.open_seats}
                    </span>
                  </td>
                </tr>
              ))}
              {sections.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-zinc-500">
                    No sections matched. Try a broader query or a different term.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
