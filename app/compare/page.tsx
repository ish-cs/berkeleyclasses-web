import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Glass, Button, SeatPill } from "@/components/glass";
import GlassNav from "@/components/glass/GlassNav";
import type { Section } from "@/lib/types";
import { intersectDays, parseMeetingDays, parseMeetingTime, sectionsConflict } from "@/lib/format";

export const dynamic = "force-dynamic";

function parseCcn(v: string | undefined): number | null {
  if (!v) return null;
  const n = parseInt(v, 10);
  return Number.isNaN(n) || n <= 0 ? null : n;
}

async function fetchSection(supabase: Awaited<ReturnType<typeof createClient>>, ccn: number) {
  const { data } = await supabase.from("sections").select("*").eq("ccn", ccn).maybeSingle();
  return (data as Section) ?? null;
}

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
    <main className="bc-page">
      <GlassNav active="/compare" />

      <Glass className="bc-hero">
        <div className="bc-eyebrow">Compare · Side-by-side</div>
        <h1 className="bc-h1">Compare <span className="bc-h1-accent">sections</span>.</h1>
        <form className="bc-hero-form" method="get" action="/compare">
          <input
            name="a"
            className="bc-input"
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            defaultValue={aCcn ?? ""}
            placeholder="First CCN"
          />
          <input
            name="b"
            className="bc-input"
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            defaultValue={bCcn ?? ""}
            placeholder="Second CCN"
          />
          <Button type="submit" variant="primary">Compare</Button>
        </form>
      </Glass>

      {(aCcn || bCcn) && <CompareResult a={sa} b={sb} aCcn={aCcn} bCcn={bCcn} />}
    </main>
  );
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
      verdict = { kind: "conflict", text: `Time conflict on ${overlap.join(", ")}` };
    } else if (overlap.length === 0) {
      verdict = { kind: "ok", text: "No time conflict" };
    } else if (!ta || !tb) {
      verdict = { kind: "warn", text: "One section is async — verify manually" };
    } else {
      verdict = { kind: "ok", text: `Same day, different time` };
    }
  }

  const verdictClass =
    verdict?.kind === "conflict"
      ? "bc-verdict bc-verdict--conflict"
      : verdict?.kind === "warn"
        ? "bc-verdict bc-verdict--warn"
        : "bc-verdict";

  return (
    <div style={{ maxWidth: 1080, margin: "0 auto", padding: "0 24px 60px" }}>
      {missing.length > 0 && (
        <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 12 }}>
          {missing.join(" · ")}. Has it been synced?{" "}
          <Link href="/find" style={{ color: "var(--ink-strong)", textDecoration: "underline" }}>
            search
          </Link>
          .
        </p>
      )}

      {a && b && verdict && (
        <div className={verdictClass} style={{ marginBottom: 20, display: "inline-block" }}>
          {verdict.text}
        </div>
      )}

      <div className="bc-compare-grid">
        <CompareCard s={a} />
        <CompareCard s={b} />
      </div>
    </div>
  );
}

function CompareCard({ s }: { s: Section | null }) {
  if (!s) {
    return (
      <Glass className="bc-compare-panel">
        <p style={{ margin: 0, color: "var(--muted)", textAlign: "center" }}>Enter a CCN above.</p>
      </Glass>
    );
  }
  return (
    <Glass className="bc-compare-panel">
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}>
        <div style={{ minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: 11, fontFamily: "var(--font-mono-sf)", color: "var(--muted)" }}>
            CCN {s.ccn}
          </p>
          <Link
            href={`/class/${s.ccn}`}
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 600,
              fontSize: 20,
              color: "var(--ink-strong)",
              textDecoration: "none",
              display: "inline-block",
              marginTop: 4,
              letterSpacing: "var(--tracking-display)",
            }}
          >
            {s.course_code} {s.section_type} {s.section_number}
          </Link>
          <p style={{ margin: "4px 0 0", fontSize: 15, color: "var(--ink-strong)" }}>{s.title}</p>
        </div>
        <SeatPill open={s.open_seats ?? 0} />
      </div>
      <dl
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "10px 16px",
          marginTop: 20,
          fontFamily: "var(--font-text)",
          fontSize: 13,
        }}
      >
        <Field label="Instructors" value={s.instructors} colSpan />
        <Field label="Days" value={s.meeting_days} />
        <Field label="Time" value={s.meeting_time} />
        <Field label="Location" value={s.location} colSpan />
        <Field label="Units" value={s.units} />
        <Field label="Open seats" value={s.open_seats} />
      </dl>
    </Glass>
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
    <div style={colSpan ? { gridColumn: "1 / -1" } : undefined}>
      <dt
        style={{
          fontSize: 10,
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          color: "var(--muted)",
        }}
      >
        {label}
      </dt>
      <dd style={{ margin: "4px 0 0", color: "var(--ink-strong)" }}>
        {value === null || value === undefined || value === "" ? "—" : value}
      </dd>
    </div>
  );
}
