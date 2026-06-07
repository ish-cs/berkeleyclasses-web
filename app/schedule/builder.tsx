"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Section } from "@/lib/types";
import { sectionsConflict } from "@/lib/format";
import type { TermGroup } from "@/lib/terms";
import ScheduleGrid from "@/components/schedule-grid";
import { GlassCard, GlassButton, GlassInput, GlassSelect } from "@/components/glass";

const DEFAULT_TERM_NAME = "Fall 2026";

const display = (size: string, weight = 600): React.CSSProperties => ({
  fontFamily: "var(--font-display)",
  fontWeight: weight,
  letterSpacing: "var(--tracking-display)",
  fontSize: size,
});
const text: React.CSSProperties = { fontFamily: "var(--font-text)", color: "var(--glass-text-muted)" };
const mono: React.CSSProperties = { fontFamily: "var(--font-mono-sf)" };
const LABEL: React.CSSProperties = {
  display: "block",
  fontFamily: "var(--font-text)",
  fontSize: "0.7rem",
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  color: "var(--glass-text-faint)",
  marginBottom: "0.4rem",
};

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
    setCombos(enumerateValid(lists, 5));
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
    const {
      data: { user },
    } = await supabase.auth.getUser();
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
    () => wishlist.map((c) => ({ course: c, count: sectionsByCourse[c]?.length ?? 0 })),
    [wishlist, sectionsByCourse],
  );

  return (
    <div>
      <GlassCard elevation={1} radius="lg" padding="1.25rem 1.25rem 1.4rem" style={{ marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.85rem", alignItems: "flex-end" }}>
          <div style={{ minWidth: "180px" }}>
            <span style={LABEL}>Term</span>
            <GlassSelect value={termId} onChange={(e) => setTermId(e.target.value)}>
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
            </GlassSelect>
          </div>
          <div style={{ flex: 1, minWidth: "260px" }}>
            <span style={LABEL}>Add course (e.g. COMPSCI 61A)</span>
            <div style={{ display: "flex", gap: "0.55rem" }}>
              <GlassInput
                type="text"
                value={courseInput}
                onChange={(e) => setCourseInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addCourse()}
                placeholder="COMPSCI 61A"
              />
              <GlassButton type="button" variant="primary" onClick={addCourse}>
                Add
              </GlassButton>
            </div>
          </div>
        </div>

        {wishlist.length > 0 && (
          <div style={{ marginTop: "1.25rem" }}>
            <p
              style={{
                fontSize: "0.625rem",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                color: "var(--glass-text-faint)",
                margin: "0 0 0.5rem",
              }}
            >
              Wishlist ({wishlist.length})
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
              {courseSummary.map((cs) => (
                <span
                  key={cs.course}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    background: "var(--glass-1)",
                    border: "1px solid var(--glass-border)",
                    padding: "0.3rem 0.8rem",
                    borderRadius: "var(--r-pill)",
                    fontFamily: "var(--font-text)",
                    fontSize: "0.8125rem",
                    color: "var(--glass-text)",
                  }}
                >
                  <span>{cs.course}</span>
                  <span style={{ color: "var(--glass-text-faint)" }}>{cs.count} sec</span>
                  <button
                    type="button"
                    onClick={() => removeCourse(cs.course)}
                    aria-label={`Remove ${cs.course}`}
                    style={{
                      background: "transparent",
                      border: "none",
                      cursor: "pointer",
                      color: "var(--glass-text-faint)",
                      lineHeight: 1,
                    }}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}
      </GlassCard>

      {error && (
        <p style={{ color: "var(--cap-conflict-text)", marginBottom: "1rem", ...text }}>{error}</p>
      )}
      {loading && (
        <p style={{ color: "var(--glass-text-faint)", marginBottom: "1rem", ...text }}>Loading sections…</p>
      )}

      {!loading &&
        courseSummary
          .filter((cs) => cs.count === 0 && sectionsByCourse[cs.course] !== undefined)
          .map((cs) => (
            <p key={cs.course} style={{ color: "var(--cap-warn-text)", margin: "0.4rem 0", ...text, fontSize: "0.875rem" }}>
              No sections found for <span style={mono}>{cs.course}</span> in this term — check the spelling or term.
            </p>
          ))}

      {wishlist.length > 0 && !loading && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <h2 style={{ margin: 0, ...display("1.35rem"), color: "var(--glass-text)" }}>
            {combos.length === 0 ? "No conflict-free combinations" : `${combos.length} conflict-free option${combos.length === 1 ? "" : "s"}`}
          </h2>
          {saveMsg && <p style={{ color: "var(--glass-text)", margin: 0, ...text, fontSize: "0.875rem" }}>{saveMsg}</p>}
          {combos.map((combo, i) => {
            const ccns = combo.map((s) => s.ccn).join(",");
            const icsName = `option-${i + 1}`;
            return (
              <GlassCard key={i} elevation={1} radius="lg" padding="1.4rem">
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "0.5rem",
                    flexWrap: "wrap",
                    marginBottom: "1rem",
                  }}
                >
                  <h3 style={{ margin: 0, ...display("1.1rem"), color: "var(--glass-text)" }}>Option {i + 1}</h3>
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <a
                      href={`/api/ics?ccns=${ccns}&name=${encodeURIComponent(icsName)}`}
                      style={{ textDecoration: "none" }}
                    >
                      <GlassButton variant="glass" size="sm">
                        Export .ics
                      </GlassButton>
                    </a>
                    <GlassButton type="button" variant="primary" size="sm" onClick={() => saveSchedule(combo)} disabled={saving}>
                      Save
                    </GlassButton>
                  </div>
                </div>
                <ScheduleGrid sections={combo} />
                <div style={{ marginTop: "1rem", overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "var(--font-text)", fontSize: "0.875rem" }}>
                    <tbody>
                      {combo.map((s) => (
                        <tr key={s.ccn} style={{ borderTop: "1px solid var(--glass-border)" }}>
                          <td style={{ padding: "0.55rem 0.85rem 0.55rem 0", ...mono, color: "var(--glass-text-faint)" }}>{s.ccn}</td>
                          <td style={{ padding: "0.55rem 0.85rem", color: "var(--glass-text)" }}>
                            {s.course_code} {s.section_type} {s.section_number}
                          </td>
                          <td style={{ padding: "0.55rem 0.85rem", color: "var(--glass-text-muted)" }}>{s.meeting_days ?? "—"}</td>
                          <td style={{ padding: "0.55rem 0.85rem", color: "var(--glass-text-muted)" }}>{s.meeting_time ?? "async"}</td>
                          <td style={{ padding: "0.55rem 0", color: "var(--glass-text-faint)" }}>{s.instructors ?? ""}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </GlassCard>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function normalizeCourseCode(raw: string): string {
  const tokens = raw.toUpperCase().replace(/[-_/]+/g, " ").split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return "";
  const subject = tokens.find((t) => /^[A-Z&]+$/.test(t));
  if (!subject) return tokens.slice(0, 2).join(" ");
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
