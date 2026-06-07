"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState, useTransition, type CSSProperties, type ReactNode } from "react";
import type { TermGroup } from "@/lib/terms";
import { GlassCard, GlassInput, GlassPill, GlassSelect } from "@/components/glass";

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

const LABEL: CSSProperties = {
  fontFamily: "var(--font-text)",
  fontSize: "0.7rem",
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  color: "var(--glass-text-faint)",
  marginBottom: "0.55rem",
  display: "block",
};

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
    <GlassCard
      elevation={1}
      radius="lg"
      padding={0}
      specular={false}
      style={{ opacity: isPending ? 0.7 : 1, transition: "opacity var(--dur) var(--spring-soft)" }}
    >
      <div
        style={{
          padding: "0.85rem 1rem",
          borderBottom: "1px solid var(--glass-border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            background: "transparent",
            border: "none",
            color: "var(--glass-text)",
            fontFamily: "var(--font-text)",
            fontSize: "0.875rem",
            fontWeight: 600,
            cursor: "pointer",
            padding: 0,
          }}
          aria-expanded={open}
        >
          <span>Filters</span>
          {activeCount > 0 && (
            <span
              style={{
                background: "var(--glass-2)",
                color: "var(--glass-text)",
                fontFamily: "var(--font-mono-sf)",
                fontSize: "0.625rem",
                padding: "0.1rem 0.4rem",
                borderRadius: "9999px",
                border: "1px solid var(--glass-border)",
              }}
            >
              {activeCount}
            </span>
          )}
        </button>
        <button
          type="button"
          onClick={resetAll}
          style={{
            background: "transparent",
            border: "none",
            cursor: "pointer",
            color: "var(--glass-text-faint)",
            fontSize: "0.75rem",
            fontFamily: "var(--font-text)",
          }}
        >
          Reset
        </button>
      </div>

      <div
        style={{
          padding: "1rem",
          display: open ? "flex" : undefined,
          flexDirection: "column",
          gap: "1.1rem",
          maxHeight: "calc(100vh - 11rem)",
          overflowY: "auto",
        }}
        className="bc-filter-body"
      >
        <Block label="Search">
          <GlassInput
            type="text"
            placeholder="Course, title, description"
            value={qLocal}
            onChange={(e) => setQLocal(e.target.value)}
          />
        </Block>

        <Block label="Term">
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
        </Block>

        <Block label="Subject">
          <GlassSelect value={current.subject} onChange={(e) => setOne("subject", e.target.value)}>
            <option value="">All subjects</option>
            {subjects.map((s) => (
              <option key={s.subject_id} value={s.name}>
                {s.name}
              </option>
            ))}
          </GlassSelect>
        </Block>

        <Block label="Availability">
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.55rem",
              fontFamily: "var(--font-text)",
              fontSize: "0.875rem",
              color: "var(--glass-text)",
              cursor: "pointer",
            }}
          >
            <input
              type="checkbox"
              checked={current.openOnly}
              onChange={(e) => setOne("open", e.target.checked ? "1" : "")}
              style={{ accentColor: "#4a90d9" }}
            />
            Open seats only
          </label>
        </Block>

        <Block label="Mode">
          <PillRow>
            <GlassPill active={!current.mode} onClick={() => setOne("mode", "")}>
              Any
            </GlassPill>
            <GlassPill active={current.mode === "in-person"} onClick={() => setOne("mode", "in-person")}>
              In-person
            </GlassPill>
            <GlassPill active={current.mode === "online"} onClick={() => setOne("mode", "online")}>
              Online
            </GlassPill>
          </PillRow>
        </Block>

        {reqOptions.length > 0 && (
          <Block label="Requirement">
            <MultiSelect
              options={reqOptions.map((o) => ({ value: o.code, label: o.code, hint: o.description }))}
              selected={current.reqs}
              onToggle={(v) => toggleMulti("reqs", v, current.reqs)}
              onClear={() => clearMulti("reqs")}
              placeholder="Any requirement"
            />
          </Block>
        )}

        <Block label="Course level">
          <PillRow>
            <GlassPill active={!current.level} onClick={() => setOne("level", "")}>
              Any
            </GlassPill>
            <GlassPill active={current.level === "lower"} onClick={() => setOne("level", "lower")}>
              Lower
            </GlassPill>
            <GlassPill active={current.level === "upper"} onClick={() => setOne("level", "upper")}>
              Upper
            </GlassPill>
            <GlassPill active={current.level === "grad"} onClick={() => setOne("level", "grad")}>
              Grad
            </GlassPill>
          </PillRow>
        </Block>

        <Block label="Days">
          <PillRow>
            {DAYS.map((d) => (
              <GlassPill
                key={d.code}
                active={current.days.includes(d.code)}
                onClick={() => toggleMulti("days", d.code, current.days)}
              >
                {d.label}
              </GlassPill>
            ))}
          </PillRow>
        </Block>

        <Block label="Type">
          <PillRow>
            {TYPES.map((t) => (
              <GlassPill
                key={t}
                active={current.types.includes(t)}
                onClick={() => toggleMulti("type", t, current.types)}
              >
                {t}
              </GlassPill>
            ))}
          </PillRow>
        </Block>

        <Block label="Units">
          <PillRow>
            <GlassPill active={!current.units} onClick={() => setOne("units", "")}>
              Any
            </GlassPill>
            {UNIT_OPTIONS.map((u) => (
              <GlassPill key={u} active={current.units === u} onClick={() => setOne("units", u)}>
                {u}
              </GlassPill>
            ))}
          </PillRow>
        </Block>

        <Block label="Instructor">
          <GlassInput
            type="text"
            placeholder="DeNero"
            value={instructorLocal}
            onChange={(e) => setInstructorLocal(e.target.value)}
          />
        </Block>
      </div>
      <style>{`
        @media (max-width: 1024px) {
          .bc-filter-body { display: ${open ? "flex" : "none"} !important; max-height: none !important; }
        }
      `}</style>
    </GlassCard>
  );
}

function Block({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <span style={LABEL}>{label}</span>
      {children}
    </div>
  );
}

function PillRow({ children }: { children: ReactNode }) {
  return <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem" }}>{children}</div>;
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
    <div ref={ref} style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderRadius: "var(--r-pill)",
          background: "rgba(0,0,0,0.22)",
          border: "1px solid var(--glass-border)",
          padding: "0.55rem 1rem",
          fontFamily: "var(--font-text)",
          fontSize: "0.875rem",
          color: selected.length === 0 ? "var(--glass-text-faint)" : "var(--glass-text)",
          textAlign: "left",
          cursor: "pointer",
        }}
      >
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{label}</span>
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ marginLeft: "0.5rem", flexShrink: 0 }}>
          <path
            d="M2 4l4 4 4-4"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {open && (
        <div
          style={{
            marginTop: "0.4rem",
            borderRadius: "var(--r-glass-sm)",
            border: "1px solid var(--glass-border)",
            background: "rgba(12, 16, 26, 0.85)",
            backdropFilter: "blur(var(--glass-blur))",
            WebkitBackdropFilter: "blur(var(--glass-blur))",
            maxHeight: "16rem",
            overflowY: "auto",
            boxShadow: "var(--glass-edge), var(--glass-shadow)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0.55rem 0.85rem",
              borderBottom: "1px solid var(--glass-border)",
            }}
          >
            <span style={{ fontSize: "0.625rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--glass-text-faint)" }}>
              {selected.length} selected
            </span>
            <button
              type="button"
              onClick={() => {
                onClear();
                setOpen(false);
              }}
              style={{
                background: "transparent",
                border: "none",
                cursor: "pointer",
                color: "var(--glass-text-faint)",
                fontSize: "0.7rem",
                fontFamily: "var(--font-text)",
              }}
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
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.55rem",
                      padding: "0.55rem 0.85rem",
                      background: "transparent",
                      border: "none",
                      cursor: "pointer",
                      color: "var(--glass-text)",
                      fontFamily: "var(--font-text)",
                      fontSize: "0.875rem",
                      textAlign: "left",
                    }}
                  >
                    <span
                      aria-hidden="true"
                      style={{
                        width: "16px",
                        height: "16px",
                        borderRadius: "4px",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: checked ? "#fff" : "transparent",
                        border: `1px solid ${checked ? "#fff" : "var(--glass-border-strong)"}`,
                        color: checked ? "#000" : "transparent",
                      }}
                    >
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                        <path d="M2 5l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                    <span style={{ flex: 1 }}>{o.label}</span>
                    {o.hint && <span style={{ fontSize: "0.625rem", color: "var(--glass-text-faint)" }}>{o.hint}</span>}
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
