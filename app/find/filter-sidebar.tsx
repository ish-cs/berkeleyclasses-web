"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
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

      <div
        className={`p-4 space-y-5 lg:max-h-[calc(100vh-9rem)] lg:overflow-y-auto ${
          open ? "" : "hidden lg:block"
        }`}
      >
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
            <MultiSelect
              options={reqOptions.map((o) => ({ value: o.code, label: o.code, hint: o.description }))}
              selected={current.reqs}
              onToggle={(v) => toggleMulti("reqs", v, current.reqs)}
              onClear={() => clearMulti("reqs")}
              placeholder="Any requirement"
            />
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
  if (c.reqs.length) n++;
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
    function handleDocClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function handleEsc(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handleDocClick);
    document.addEventListener("keydown", handleEsc);
    return () => {
      document.removeEventListener("mousedown", handleDocClick);
      document.removeEventListener("keydown", handleEsc);
    };
  }, [open]);

  const label =
    selected.length === 0
      ? placeholder
      : selected.length === 1
      ? selected[0]
      : `${selected.length} selected`;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="w-full flex items-center justify-between rounded-md bg-zinc-900 border border-zinc-800 px-3 py-2 text-sm text-left hover:border-zinc-600"
      >
        <span className={selected.length === 0 ? "text-zinc-500" : "text-zinc-200 truncate"}>
          {label}
        </span>
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="text-zinc-500 shrink-0 ml-2">
          <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div className="absolute left-0 right-0 mt-1 z-20 rounded-md border border-zinc-800 bg-zinc-950 shadow-lg shadow-black/50 max-h-72 overflow-y-auto">
          <div className="flex items-center justify-between border-b border-zinc-900 px-3 py-2">
            <span className="text-[11px] uppercase tracking-wider text-zinc-500">
              {selected.length} selected
            </span>
            <button
              type="button"
              onClick={() => {
                onClear();
                setOpen(false);
              }}
              className="text-xs text-zinc-500 hover:text-zinc-300"
            >
              Clear
            </button>
          </div>
          <ul role="listbox" aria-multiselectable="true">
            {options.map((o) => {
              const checked = selected.includes(o.value);
              return (
                <li key={o.value}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={checked}
                    onClick={() => onToggle(o.value)}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-zinc-900 text-left"
                  >
                    <span
                      className={
                        "inline-flex items-center justify-center w-4 h-4 rounded border " +
                        (checked
                          ? "bg-white border-white text-black"
                          : "border-zinc-700 text-transparent")
                      }
                      aria-hidden="true"
                    >
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                        <path d="M2 5l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                    <span className="flex-1 text-zinc-200">{o.label}</span>
                    {o.hint && <span className="text-[10px] text-zinc-500">{o.hint}</span>}
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
