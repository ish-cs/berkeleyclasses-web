import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import Nav from "@/components/nav";
import type { Section } from "@/lib/types";
import { intersectDays, parseMeetingDays, parseMeetingTime, sectionsConflict } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<{ a?: string; b?: string }>;
}) {
  const { a, b } = await searchParams;
  const aCcn = parseCcn(a);
  const bCcn = parseCcn(b);

  const supabase = await createClient();
  const sa = aCcn ? await fetchSection(supabase, aCcn) : null;
  const sb = bCcn ? await fetchSection(supabase, bCcn) : null;

  return (
    <main className="min-h-screen bg-black text-white">
      <Nav />
      <section className="mx-auto max-w-5xl px-6 py-10">
        <h1 className="text-3xl font-semibold mb-2">Compare sections</h1>
        <p className="text-zinc-500 mb-8">
          Two CCNs side-by-side, with a conflict verdict.
        </p>

        <form method="get" className="grid gap-3 sm:grid-cols-3 mb-10">
          <input
            type="text"
            name="a"
            inputMode="numeric"
            pattern="[0-9]*"
            defaultValue={aCcn ?? ""}
            placeholder="First CCN"
            className="rounded-md bg-zinc-900 border border-zinc-800 px-3 py-2 outline-none focus:border-zinc-500"
          />
          <input
            type="text"
            name="b"
            inputMode="numeric"
            pattern="[0-9]*"
            defaultValue={bCcn ?? ""}
            placeholder="Second CCN"
            className="rounded-md bg-zinc-900 border border-zinc-800 px-3 py-2 outline-none focus:border-zinc-500"
          />
          <button
            type="submit"
            className="rounded-md bg-white text-black px-4 py-2 font-medium hover:bg-zinc-200"
          >
            Compare
          </button>
        </form>

        {(aCcn || bCcn) && (
          <CompareResult a={sa} b={sb} aCcn={aCcn} bCcn={bCcn} />
        )}
      </section>
    </main>
  );
}

function parseCcn(v: string | undefined): number | null {
  if (!v) return null;
  const n = parseInt(v, 10);
  return Number.isNaN(n) || n <= 0 ? null : n;
}

async function fetchSection(supabase: Awaited<ReturnType<typeof createClient>>, ccn: number) {
  const { data } = await supabase.from("sections").select("*").eq("ccn", ccn).maybeSingle();
  return (data as Section) ?? null;
}

function CompareResult({
  a,
  b,
  aCcn,
  bCcn,
}: {
  a: Section | null;
  b: Section | null;
  aCcn: number | null;
  bCcn: number | null;
}) {
  const missing: string[] = [];
  if (aCcn && !a) missing.push(`${aCcn} not found`);
  if (bCcn && !b) missing.push(`${bCcn} not found`);

  let verdict: { kind: "ok" | "warn" | "conflict"; text: string } | null = null;
  if (a && b) {
    const daysA = parseMeetingDays(a.meeting_days);
    const daysB = parseMeetingDays(b.meeting_days);
    const overlap = intersectDays(daysA, daysB);
    const ta = parseMeetingTime(a.meeting_time);
    const tb = parseMeetingTime(b.meeting_time);
    if (sectionsConflict(a, b)) {
      verdict = { kind: "conflict", text: `CONFLICT on ${overlap.join(", ")}` };
    } else if (overlap.length === 0) {
      verdict = { kind: "ok", text: "No overlapping days" };
    } else if (!ta || !tb) {
      verdict = { kind: "warn", text: "One section is async — verify manually" };
    } else {
      verdict = { kind: "ok", text: `Same days (${overlap.join(", ")}) but non-overlapping times` };
    }
  }

  return (
    <>
      {missing.length > 0 && (
        <p className="text-yellow-400 text-sm mb-4">
          {missing.join(" · ")}. Has it been synced? Try{" "}
          <Link href="/find" className="underline">
            search
          </Link>
          .
        </p>
      )}

      {a && b && verdict && (
        <div
          className={
            "mb-6 rounded-md px-4 py-3 text-sm font-medium " +
            (verdict.kind === "conflict"
              ? "bg-red-950 text-red-300 border border-red-900"
              : verdict.kind === "warn"
              ? "bg-yellow-950 text-yellow-300 border border-yellow-900"
              : "bg-green-950 text-green-300 border border-green-900")
          }
        >
          {verdict.text}
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-6">
        <SectionCard s={a} />
        <SectionCard s={b} />
      </div>
    </>
  );
}

function SectionCard({ s }: { s: Section | null }) {
  if (!s) {
    return (
      <div className="rounded-lg border border-dashed border-zinc-800 px-5 py-6 text-zinc-500">
        Enter a CCN above.
      </div>
    );
  }
  return (
    <div className="rounded-lg border border-zinc-900 px-5 py-5">
      <p className="text-xs text-zinc-500">CCN {s.ccn}</p>
      <Link href={`/class/${s.ccn}`} className="text-xl font-semibold hover:text-white">
        {s.course_code} {s.section_type} {s.section_number}
      </Link>
      <p className="text-zinc-300 mt-1">{s.title}</p>
      <dl className="grid grid-cols-2 gap-y-2 mt-4 text-sm">
        <Field label="Instructors" value={s.instructors} colSpan />
        <Field label="Days" value={s.meeting_days} />
        <Field label="Time" value={s.meeting_time} />
        <Field label="Location" value={s.location} colSpan />
        <Field label="Units" value={s.units} />
        <Field label="Open seats" value={s.open_seats} />
      </dl>
    </div>
  );
}

function Field({
  label,
  value,
  colSpan,
}: {
  label: string;
  value: string | number | null;
  colSpan?: boolean;
}) {
  return (
    <div className={colSpan ? "col-span-2" : ""}>
      <dt className="text-zinc-500 text-xs">{label}</dt>
      <dd className="text-zinc-200">{value === null || value === undefined || value === "" ? "—" : value}</dd>
    </div>
  );
}
