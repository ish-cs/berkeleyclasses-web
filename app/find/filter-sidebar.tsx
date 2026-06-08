"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import type { TermGroup } from "@/lib/terms";
import { Chip, Glass, GlassInput, GlassSelect } from "@/components/glass";

type Subject = { subject_id: string; name: string };
type ReqOption = { code: string; description: string };

type CurrentFilters = {
  q: string;
  term: string;
  subject: string;
  openOnly: boolean;
  mode: string;
  level: string;
  types: string[];
  days: string[];
  units: string;
  instructor: string;
  reqs: string[];
  sort: string;
};

const DAYS = [
  { code: "Mo", label: "Mon" },
  { code: "Tu", label: "Tue" },
  { code: "We", label: "Wed" },
  { code: "Th", label: "Thu" },
  { code: "Fr", label: "Fri" },
];
const TYPES = ["LEC", "DIS", "LAB", "SEM", "STD"];
const UNIT_OPTIONS = ["1", "2", "3", "4", "5"];

export default function FilterSidebar({
  termGroups,
  subjects,
  reqOptions,
  current,
}: {
  termGroups: TermGroup[];
  subjects: Subject[];
  reqOptions: ReqOption[];
  current: CurrentFilters;
}) {
  const router = useRouter();
  const sp = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [qLocal, setQLocal] = useState(current.q);
  const [instructorLocal, setInstructorLocal] = useState(current.instructor);
  const [open, setOpen] = useState(false);

  useEffect(() => setQLocal(current.q), [current.q]);
  useEffect(() => setInstructorLocal(current.instructor), [current.instructor]);

  const pushParam = useCallback(
    (mutate: (p: URLSearchParams) => void) => {
      const params = new URLSearchParams(sp.toString());
      mutate(params);
      startTransition(() => {
        router.replace(`/find?${params.toString()}`, { scroll: false });
      });
    },
    [router, sp],
  );

  useEffect(() => {
    const t = setTimeout(() => {
      if (qLocal === current.q) return;
      pushParam((p) => {
        if (qLocal) p.set("q", qLocal);
        else p.delete("q");
      });
    }, 250);
    return () => clearTimeout(t);
  }, [qLocal, current.q, pushParam]);

  useEffect(() => {
    const t = setTimeout(() => {
      if (instructorLocal === current.instructor) return;
      pushParam((p) => {
        if (instructorLocal) p.set("instructor", instructorLocal);
        else p.delete("instructor");
      });
    }, 250);
    return () => clearTimeout(t);
  }, [instructorLocal, current.instructor, pushParam]);

  function setOne(key: string, value: string) {
    pushParam((p) => {
      if (value) p.set(key, value);
      else p.delete(key);
    });
  }

  function toggleMulti(key: string, value: string, currentArr: string[]) {
    const next = currentArr.includes(value) ? currentArr.filter((v) => v !== value) : [...currentArr, value];
    pushParam((p) => {
      if (next.length === 0) p.delete(key);
      else p.set(key, next.join(","));
    });
  }

  function clearMulti(key: string) {
    pushParam((p) => p.delete(key));
  }

  function resetAll() {
    setQLocal("");
    setInstructorLocal("");
    startTransition(() => router.replace("/find", { scroll: false }));
  }

  const activeCount = countActive(current);

  return (
    <Glass as="aside" className="bc-filters" style={{ opacity: isPending ? 0.7 : 1, transition: "opacity var(--dur) var(--spring-soft)" }}>
      {/* Header row */}
      <div className="bc-filters-group" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 0 }}>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          style={{
            display: "flex", alignItems: "center", gap: "0.5rem",
            background: "transparent", border: "none",
            color: "var(--ink)", fontFamily: "inherit",
            fontSize: "13px", fontWeight: 600, cursor: "pointer", padding: 0,
          }}
          aria-expanded={open}
        >
          <span>Filters</span>
          {activeCount > 0 && (
            <span style={{
              background: "var(--glass-fill-strong)", color: "var(--ink)",
              fontSize: "10px", padding: "1px 6px", borderRadius: "9999px",
              border: "0.5px solid var(--glass-border)",
            }}>
              {activeCount}
            </span>
          )}
        </button>
        <button type="button" onClick={resetAll} className="bc-filters-reset">Reset</button>
      </div>

      <div className={`bc-filter-body${open ? " bc-filter-body--open" : ""}`}>
        {/* Search */}
        <div className="bc-filters-group">
          <h4 className="bc-h4">Search</h4>
          <GlassInput
            type="text"
            placeholder="Course, title, description"
            value={qLocal}
            onChange={(e) => setQLocal(e.target.value)}
          />
        </div>

        {/* Term */}
        <div className="bc-filters-group">
          <h4 className="bc-h4">Term</h4>
          <GlassSelect value={current.term} onChange={(e) => setOne("term", e.target.value)}>
            {termGroups.map((g) =>
              g.kind === "single" ? (
                <option key={g.term.term_id} value={g.term.name}>
                  {g.term.name}
                </option>
              ) : (
                <optgroup key={g.parent.term_id} label={g.parent.name}>
                  <option value={g.parent.name}>All {g.parent.name}</option>
                  {g.children.map((c) => (
                    <option key={c.term_id} value={c.name}>
                      &nbsp;&nbsp;{c.name}
                    </option>
                  ))}
                </optgroup>
              ),
            )}
          </GlassSelect>
        </div>

        {/* Subject */}
        <div className="bc-filters-group">
          <h4 className="bc-h4">Subject</h4>
          <GlassSelect value={current.subject} onChange={(e) => setOne("subject", e.target.value)}>
            <option value="">All subjects</option>
            {subjects.map((s) => (
              <option key={s.subject_id} value={s.name}>
                {s.name}
              </option>
            ))}
          </GlassSelect>
        </div>

        {/* Availability */}
        <div className="bc-filters-group">
          <h4 className="bc-h4">Availability</h4>
          <label className="bc-filter-checkbox">
            <input
              type="checkbox"
              checked={current.openOnly}
              onChange={(e) => setOne("open", e.target.checked ? "1" : "")}
            />
            Open seats only
          </label>
        </div>

        {/* Mode */}
        <div className="bc-filters-group">
          <h4 className="bc-h4">Mode</h4>
          <div className="bc-chip-row">
            <Chip selected={!current.mode} onClick={() => setOne("mode", "")}>Any</Chip>
            <Chip selected={current.mode === "in-person"} onClick={() => setOne("mode", "in-person")}>In-person</Chip>
            <Chip selected={current.mode === "online"} onClick={() => setOne("mode", "online")}>Online</Chip>
          </div>
        </div>

        {/* Requirement */}
        {reqOptions.length > 0 && (
          <div className="bc-filters-group">
            <h4 className="bc-h4">Requirement</h4>
            <MultiSelect
              options={reqOptions.map((o) => ({ value: o.code, label: o.code, hint: o.description }))}
              selected={current.reqs}
              onToggle={(v) => toggleMulti("reqs", v, current.reqs)}
              onClear={() => clearMulti("reqs")}
              placeholder="Any requirement"
            />
          </div>
        )}

        {/* Course level */}
        <div className="bc-filters-group">
          <h4 className="bc-h4">Course level</h4>
          <div className="bc-chip-row">
            <Chip selected={!current.level} onClick={() => setOne("level", "")}>Any</Chip>
            <Chip selected={current.level === "lower"} onClick={() => setOne("level", "lower")}>Lower</Chip>
            <Chip selected={current.level === "upper"} onClick={() => setOne("level", "upper")}>Upper</Chip>
            <Chip selected={current.level === "grad"} onClick={() => setOne("level", "grad")}>Grad</Chip>
          </div>
        </div>

        {/* Days */}
        <div className="bc-filters-group">
          <h4 className="bc-h4">Days</h4>
          <div className="bc-chip-row">
            {DAYS.map((d) => (
              <Chip
                key={d.code}
                selected={current.days.includes(d.code)}
                onClick={() => toggleMulti("days", d.code, current.days)}
              >
                {d.label}
              </Chip>
            ))}
          </div>
        </div>

        {/* Type */}
        <div className="bc-filters-group">
          <h4 className="bc-h4">Type</h4>
          <div className="bc-chip-row">
            {TYPES.map((t) => (
              <Chip
                key={t}
                selected={current.types.includes(t)}
                onClick={() => toggleMulti("type", t, current.types)}
              >
                {t}
              </Chip>
            ))}
          </div>
        </div>

        {/* Units */}
        <div className="bc-filters-group">
          <h4 className="bc-h4">Units</h4>
          <div className="bc-chip-row">
            <Chip selected={!current.units} onClick={() => setOne("units", "")}>Any</Chip>
            {UNIT_OPTIONS.map((u) => (
              <Chip key={u} selected={current.units === u} onClick={() => setOne("units", u)}>
                {u}
              </Chip>
            ))}
          </div>
        </div>

        {/* Instructor */}
        <div className="bc-filters-group">
          <h4 className="bc-h4">Instructor</h4>
          <GlassInput
            type="text"
            placeholder="DeNero"
            value={instructorLocal}
            onChange={(e) => setInstructorLocal(e.target.value)}
          />
        </div>
      </div>
    </Glass>
  );
}

function countActive(c: CurrentFilters): number {
  let n = 0;
  if (c.q) n++;
  if (c.subject) n++;
  if (c.openOnly) n++;
  if (c.mode) n++;
  if (c.level) n++;
  if (c.reqs.length) n++;
  if (c.types.length) n++;
  if (c.days.length) n++;
  if (c.units) n++;
  if (c.instructor) n++;
  return n;
}

type MultiSelectOption = { value: string; label: string; hint?: string };

function MultiSelect({
  options,
  selected,
  onToggle,
  onClear,
  placeholder,
}: {
  options: MultiSelectOption[];
  selected: string[];
  onToggle: (value: string) => void;
  onClear: () => void;
  placeholder: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onEsc(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onEsc);
    };
  }, [open]);

  const label =
    selected.length === 0
      ? placeholder
      : selected.length === 1
        ? selected[0]
        : `${selected.length} selected`;

  return (
    <div ref={ref} className="bc-multi">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="bc-multi-trigger"
      >
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{label}</span>
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ marginLeft: "0.5rem", flexShrink: 0 }}>
          <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div className="bc-multi-menu">
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "8px 12px", borderBottom: "0.5px solid var(--glass-border)",
          }}>
            <span style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--muted)" }}>
              {selected.length} selected
            </span>
            <button
              type="button"
              onClick={() => { onClear(); setOpen(false); }}
              className="bc-filters-reset"
            >
              Clear
            </button>
          </div>
          <ul style={{ margin: 0, padding: 0, listStyle: "none" }} role="listbox" aria-multiselectable="true">
            {options.map((o) => {
              const checked = selected.includes(o.value);
              return (
                <li key={o.value}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={checked}
                    onClick={() => onToggle(o.value)}
                    className="bc-multi-row"
                  >
                    <span aria-hidden="true" className="check" />
                    <span style={{ flex: 1 }}>{o.label}</span>
                    {o.hint && <span style={{ fontSize: "10px", color: "var(--muted)" }}>{o.hint}</span>}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
