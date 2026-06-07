"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Section } from "@/lib/types";
import { sectionsConflict } from "@/lib/format";
import type { TermGroup } from "@/lib/terms";
import ScheduleGrid from "@/components/schedule-grid";

const DEFAULT_TERM_NAME = "Fall 2026";

function flattenTerms(groups: TermGroup[]): { term_id: string; name: string }[] {
  const out: { term_id: string; name: string }[] = [];
  for (const g of groups) {
    if (g.kind === "single") out.push(g.term);
    else {
      out.push(g.parent);
      out.push(...g.children);
    }
  }
  return out;
}

export default function ScheduleBuilder({ termGroups }: { termGroups: TermGroup[] }) {
  const terms = useMemo(() => flattenTerms(termGroups), [termGroups]);
  const initialTerm = terms.find((t) => t.name === DEFAULT_TERM_NAME)?.term_id ?? terms[0]?.term_id ?? "";
  const [termId, setTermId] = useState(initialTerm);
  const [courseInput, setCourseInput] = useState("");
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [sectionsByCourse, setSectionsByCourse] = useState<Record<string, Section[]>>({});
  const [combos, setCombos] = useState<Section[][]>([]);
  const [loading, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!termId) return;
    setError(null);
    startTransition(async () => {
      const supabase = createClient();
      const out: Record<string, Section[]> = {};
      for (const course of wishlist) {
        const { data, error } = await supabase
          .from("sections")
          .select("*")
          .eq("term_id", termId)
          .ilike("course_code", course)
          .order("section_number");
        if (error) {
          setError(`${course}: ${error.message}`);
          continue;
        }
        out[course] = (data ?? []) as Section[];
      }
      setSectionsByCourse(out);
    });
  }, [termId, wishlist]);

  useEffect(() => {
    if (wishlist.length === 0) {
      setCombos([]);
      return;
    }
    const lists: Section[][] = wishlist
      .map((c) => sectionsByCourse[c] ?? [])
      .map((sections) =>
        sections.filter((s) => s.section_type === "LEC" || sections.every((x) => x.section_type !== "LEC")),
      );
    if (lists.some((l) => l.length === 0)) {
      setCombos([]);
      return;
    }
    const found = enumerateValid(lists, 5);
    setCombos(found);
  }, [sectionsByCourse, wishlist]);

  function addCourse() {
    const c = normalizeCourseCode(courseInput);
    if (!c || wishlist.includes(c)) return;
    setWishlist([...wishlist, c]);
    setCourseInput("");
  }

  function removeCourse(c: string) {
    setWishlist(wishlist.filter((x) => x !== c));
    const next = { ...sectionsByCourse };
    delete next[c];
    setSectionsByCourse(next);
  }

  async function saveSchedule(combo: Section[]) {
    setSaving(true);
    setSaveMsg(null);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      window.location.href = `/auth/signin?next=${encodeURIComponent("/schedule")}`;
      return;
    }
    const ccns = combo.map((s) => s.ccn);
    const { error } = await supabase.from("saved_schedules").insert({
      user_id: user.id,
      term_id: termId,
      name: `${wishlist.join(", ")} — ${new Date().toLocaleDateString()}`,
      ccns,
    });
    if (error) setSaveMsg(`Save failed: ${error.message}`);
    else setSaveMsg("Saved to your account.");
    setSaving(false);
  }

  const courseSummary = useMemo(
    () =>
      wishlist.map((c) => ({
        course: c,
        count: sectionsByCourse[c]?.length ?? 0,
      })),
    [wishlist, sectionsByCourse],
  );

  return (
    <div>
      <div className="flex flex-wrap gap-3 items-end mb-6">
        <div>
          <label className="block text-xs text-zinc-500 mb-1">Term</label>
          <select
            value={termId}
            onChange={(e) => setTermId(e.target.value)}
            className="rounded-md bg-zinc-900 border border-zinc-800 px-3 py-2 outline-none focus:border-zinc-500"
          >
            {termGroups.map((g) =>
              g.kind === "single" ? (
                <option key={g.term.term_id} value={g.term.term_id}>
                  {g.term.name}
                </option>
              ) : (
                <optgroup key={g.parent.term_id} label={g.parent.name}>
                  <option value={g.parent.term_id}>{g.parent.name}</option>
                  {g.children.map((c) => (
                    <option key={c.term_id} value={c.term_id}>
                      &nbsp;&nbsp;{c.name}
                    </option>
                  ))}
                </optgroup>
              ),
            )}
          </select>
        </div>
        <div className="flex-1 min-w-[260px]">
          <label className="block text-xs text-zinc-500 mb-1">Add course (e.g. COMPSCI 61A)</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={courseInput}
              onChange={(e) => setCourseInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addCourse()}
              placeholder="COMPSCI 61A"
              className="flex-1 rounded-md bg-zinc-900 border border-zinc-800 px-3 py-2 outline-none focus:border-zinc-500"
            />
            <button
              type="button"
              onClick={addCourse}
              className="rounded-md bg-white text-black px-4 py-2 font-medium hover:bg-zinc-200"
            >
              Add
            </button>
          </div>
        </div>
      </div>

      {wishlist.length > 0 && (
        <div className="mb-8">
          <p className="text-xs text-zinc-500 mb-2">Wishlist ({wishlist.length})</p>
          <div className="flex flex-wrap gap-2">
            {courseSummary.map((cs) => (
              <span
                key={cs.course}
                className="inline-flex items-center gap-2 rounded-md bg-zinc-900 border border-zinc-800 px-3 py-1.5 text-sm"
              >
                <span>{cs.course}</span>
                <span className="text-zinc-500">{cs.count} sections</span>
                <button
                  type="button"
                  onClick={() => removeCourse(cs.course)}
                  className="text-zinc-500 hover:text-red-400"
                  aria-label={`Remove ${cs.course}`}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
      {loading && <p className="text-zinc-500 text-sm mb-4">Loading sections…</p>}

      {!loading && wishlist.length > 0 && (
        <>
          {courseSummary
            .filter((cs) => cs.count === 0 && sectionsByCourse[cs.course] !== undefined)
            .map((cs) => (
              <p key={cs.course} className="text-amber-300 text-sm mb-2">
                No sections found for <span className="font-mono">{cs.course}</span> in this term —
                check the spelling or term.
              </p>
            ))}
        </>
      )}

      {wishlist.length > 0 && !loading && (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold">
            {combos.length === 0
              ? "No conflict-free combinations"
              : `${combos.length} conflict-free option${combos.length === 1 ? "" : "s"}`}
          </h2>
          {saveMsg && <p className="text-sm text-zinc-300">{saveMsg}</p>}
          {combos.map((combo, i) => {
            const ccns = combo.map((s) => s.ccn).join(",");
            const icsName = `option-${i + 1}`;
            return (
              <div key={i} className="rounded-lg border border-zinc-900 p-5">
                <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
                  <h3 className="font-semibold">Option {i + 1}</h3>
                  <div className="flex gap-2">
                    <a
                      href={`/api/ics?ccns=${ccns}&name=${encodeURIComponent(icsName)}`}
                      className="rounded-md border border-zinc-700 text-zinc-200 px-3 py-1.5 text-sm font-medium hover:border-zinc-500"
                    >
                      Export .ics
                    </a>
                    <button
                      type="button"
                      onClick={() => saveSchedule(combo)}
                      disabled={saving}
                      className="rounded-md bg-white text-black px-3 py-1.5 text-sm font-medium hover:bg-zinc-200 disabled:opacity-50"
                    >
                      Save
                    </button>
                  </div>
                </div>
                <ScheduleGrid sections={combo} />
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full text-sm">
                    <tbody>
                      {combo.map((s) => (
                        <tr key={s.ccn} className="border-t border-zinc-900 first:border-t-0">
                          <td className="py-2 pr-4 font-mono text-zinc-500">{s.ccn}</td>
                          <td className="py-2 pr-4 font-medium">
                            {s.course_code} {s.section_type} {s.section_number}
                          </td>
                          <td className="py-2 pr-4 text-zinc-400">{s.meeting_days ?? "—"}</td>
                          <td className="py-2 pr-4 text-zinc-400">{s.meeting_time ?? "async"}</td>
                          <td className="py-2 text-zinc-500">{s.instructors ?? ""}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Normalize varied user input into the canonical "SUBJECT NUMBER" form the
// sections table uses. Examples:
//   "compsci 70"               -> "COMPSCI 70"
//   "COLWRIT-R4B"              -> "COLWRIT R4B"
//   "COLWRIT R4B 020"          -> "COLWRIT R4B"
//   "COMPSCI 70 LEC 001"       -> "COMPSCI 70"
//   "COMPSCI C8"               -> "COMPSCI C8"
// We accept the first alpha-only token as the subject and the first
// numeric-leading token (which may have a letter prefix like R/C and a
// letter suffix like A/B/AC) as the course number. Anything after is
// ignored — that's where users tend to paste a section CCN or LEC code.
export function normalizeCourseCode(raw: string): string {
  const tokens = raw.toUpperCase().replace(/[-_/]+/g, " ").split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return "";
  const subject = tokens.find((t) => /^[A-Z&]+$/.test(t));
  if (!subject) return tokens.slice(0, 2).join(" "); // fallback to best guess
  const afterSubject = tokens.slice(tokens.indexOf(subject) + 1);
  const number = afterSubject.find((t) => /^[A-Z]?\d+[A-Z]*$/.test(t));
  if (!number) return subject;
  return `${subject} ${number}`;
}

function enumerateValid(lists: Section[][], cap: number): Section[][] {
  const out: Section[][] = [];
  const cur: Section[] = [];
  function recurse(idx: number) {
    if (out.length >= cap) return;
    if (idx === lists.length) {
      out.push([...cur]);
      return;
    }
    for (const candidate of lists[idx]) {
      let conflicted = false;
      for (const chosen of cur) {
        if (sectionsConflict(chosen, candidate)) {
          conflicted = true;
          break;
        }
      }
      if (conflicted) continue;
      cur.push(candidate);
      recurse(idx + 1);
      cur.pop();
      if (out.length >= cap) return;
    }
  }
  recurse(0);
  return out;
}
