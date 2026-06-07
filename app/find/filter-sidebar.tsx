"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState, useTransition } from "react";
import type { TermGroup } from "@/lib/terms";

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
  req: string;
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

  // Sync local inputs when nav changes URL externally
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

  // Debounce free-text inputs into URL
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

  function toggleMulti(key: string, value: string, current: string[]) {
    const next = current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
    pushParam((p) => {
      if (next.length === 0) p.delete(key);
      else p.set(key, next.join(","));
    });
  }

  function resetAll() {
    setQLocal("");
    setInstructorLocal("");
    startTransition(() => router.replace("/find", { scroll: false }));
  }

  const activeCount = countActive(current);

  return (
    <div className={`rounded-lg border border-zinc-900 ${isPending ? "opacity-70" : ""} transition-opacity`}>
      <div className="border-b border-zinc-900 px-4 py-3 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-2 text-sm font-semibold lg:cursor-default"
          aria-expanded={open}
        >
          <span>Filters</span>
          {activeCount > 0 && (
            <span className="rounded-full bg-zinc-800 text-zinc-200 text-[10px] font-mono px-1.5 py-0.5">
              {activeCount}
            </span>
          )}
          <svg
            width="12" height="12" viewBox="0 0 12 12" fill="none"
            className={"lg:hidden transition-transform " + (open ? "rotate-180" : "")}
          >
            <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <button
          type="button"
          onClick={resetAll}
          className="text-xs text-zinc-500 hover:text-zinc-300"
        >
          Reset
        </button>
      </div>

      <div className={`p-4 space-y-5 ${open ? "" : "hidden lg:block"}`}>
        <FilterBlock label="Search">
          <input
            type="text"
            placeholder="Course, title, description"
            value={qLocal}
            onChange={(e) => setQLocal(e.target.value)}
            className="w-full rounded-md bg-zinc-900 border border-zinc-800 px-3 py-2 text-sm outline-none focus:border-zinc-500"
          />
        </FilterBlock>

        <FilterBlock label="Term">
          <select
            value={current.term}
            onChange={(e) => setOne("term", e.target.value)}
            className="w-full rounded-md bg-zinc-900 border border-zinc-800 px-3 py-2 text-sm outline-none focus:border-zinc-500"
          >
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
          </select>
        </FilterBlock>

        <FilterBlock label="Subject">
          <select
            value={current.subject}
            onChange={(e) => setOne("subject", e.target.value)}
            className="w-full rounded-md bg-zinc-900 border border-zinc-800 px-3 py-2 text-sm outline-none focus:border-zinc-500"
          >
            <option value="">All subjects</option>
            {subjects.map((s) => (
              <option key={s.subject_id} value={s.name}>
                {s.name}
              </option>
            ))}
          </select>
        </FilterBlock>

        <FilterBlock label="Availability">
          <label className="flex items-center gap-2 text-sm text-zinc-300">
            <input
              type="checkbox"
              checked={current.openOnly}
              onChange={(e) => setOne("open", e.target.checked ? "1" : "")}
              className="accent-white"
            />
            Open seats only
          </label>
        </FilterBlock>

        <FilterBlock label="Mode">
          <div className="grid grid-cols-3 gap-1">
            <PillButton active={!current.mode} onClick={() => setOne("mode", "")}>
              Any
            </PillButton>
            <PillButton
              active={current.mode === "in-person"}
              onClick={() => setOne("mode", "in-person")}
            >
              In-person
            </PillButton>
            <PillButton
              active={current.mode === "online"}
              onClick={() => setOne("mode", "online")}
            >
              Online
            </PillButton>
          </div>
        </FilterBlock>

        {reqOptions.length > 0 && (
          <FilterBlock label="Requirement">
            <div className="flex flex-wrap gap-1">
              <PillButton active={!current.req} onClick={() => setOne("req", "")}>
                Any
              </PillButton>
              {reqOptions.map((r) => (
                <PillButton
                  key={r.code}
                  active={current.req === r.code}
                  onClick={() => setOne("req", r.code)}
                >
                  <span title={r.description}>{r.code}</span>
                </PillButton>
              ))}
            </div>
          </FilterBlock>
        )}

        <FilterBlock label="Course level">
          <div className="grid grid-cols-4 gap-1">
            <PillButton active={!current.level} onClick={() => setOne("level", "")}>
              Any
            </PillButton>
            <PillButton active={current.level === "lower"} onClick={() => setOne("level", "lower")}>
              Lower
            </PillButton>
            <PillButton active={current.level === "upper"} onClick={() => setOne("level", "upper")}>
              Upper
            </PillButton>
            <PillButton active={current.level === "grad"} onClick={() => setOne("level", "grad")}>
              Grad
            </PillButton>
          </div>
        </FilterBlock>

        <FilterBlock label="Days">
          <div className="flex flex-wrap gap-1">
            {DAYS.map((d) => (
              <PillButton
                key={d.code}
                active={current.days.includes(d.code)}
                onClick={() => toggleMulti("days", d.code, current.days)}
              >
                {d.label}
              </PillButton>
            ))}
          </div>
        </FilterBlock>

        <FilterBlock label="Type">
          <div className="flex flex-wrap gap-1">
            {TYPES.map((t) => (
              <PillButton
                key={t}
                active={current.types.includes(t)}
                onClick={() => toggleMulti("type", t, current.types)}
              >
                {t}
              </PillButton>
            ))}
          </div>
        </FilterBlock>

        <FilterBlock label="Units">
          <div className="flex flex-wrap gap-1">
            <PillButton active={!current.units} onClick={() => setOne("units", "")}>
              Any
            </PillButton>
            {UNIT_OPTIONS.map((u) => (
              <PillButton
                key={u}
                active={current.units === u}
                onClick={() => setOne("units", u)}
              >
                {u}
              </PillButton>
            ))}
          </div>
        </FilterBlock>

        <FilterBlock label="Instructor">
          <input
            type="text"
            placeholder="DeNero"
            value={instructorLocal}
            onChange={(e) => setInstructorLocal(e.target.value)}
            className="w-full rounded-md bg-zinc-900 border border-zinc-800 px-3 py-2 text-sm outline-none focus:border-zinc-500"
          />
        </FilterBlock>
      </div>
    </div>
  );
}

function countActive(c: CurrentFilters): number {
  let n = 0;
  if (c.q) n++;
  if (c.subject) n++;
  if (c.openOnly) n++;
  if (c.mode) n++;
  if (c.level) n++;
  if (c.req) n++;
  if (c.types.length) n++;
  if (c.days.length) n++;
  if (c.units) n++;
  if (c.instructor) n++;
  return n;
}

function FilterBlock({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wider text-zinc-500 mb-2">{label}</p>
      {children}
    </div>
  );
}

function PillButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "rounded-md px-2.5 py-1 text-xs font-medium transition-colors " +
        (active
          ? "bg-white text-black border border-white"
          : "bg-zinc-900 border border-zinc-800 text-zinc-300 hover:border-zinc-600")
      }
    >
      {children}
    </button>
  );
}
