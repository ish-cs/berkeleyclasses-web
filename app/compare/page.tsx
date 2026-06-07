import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {  GlassCard, GlassButton, GlassInput, SeatCapsule } from "@/components/glass";
import GlassNav from "@/components/glass/GlassNav";
import type { Section } from "@/lib/types";
import { intersectDays, parseMeetingDays, parseMeetingTime, sectionsConflict } from "@/lib/format";

export const dynamic = "force-dynamic";

const WRAP: React.CSSProperties = { maxWidth: "1080px", margin: "0 auto", padding: "1.75rem 1.5rem 4rem" };
const display = (size: string, weight = 600): React.CSSProperties => ({
  fontFamily: "var(--font-display)",
  fontWeight: weight,
  letterSpacing: "var(--tracking-display)",
  fontSize: size,
});
const text: React.CSSProperties = { fontFamily: "var(--font-text)", color: "var(--glass-text-muted)" };
const mono: React.CSSProperties = { fontFamily: "var(--font-mono-sf)" };

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
    <>
      <GlassNav />
      <section style={WRAP}>
        <h1 style={{ margin: 0, ...display("2rem"), color: "var(--glass-text)" }}>Compare sections</h1>
        <p style={{ margin: "0.4rem 0 2rem", ...text }}>Two CCNs side-by-side, with a conflict verdict.</p>

        <form
          method="get"
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr auto",
            gap: "0.75rem",
            marginBottom: "2rem",
          }}
        >
          <GlassInput name="a" type="text" inputMode="numeric" pattern="[0-9]*" defaultValue={aCcn ?? ""} placeholder="First CCN" />
          <GlassInput name="b" type="text" inputMode="numeric" pattern="[0-9]*" defaultValue={bCcn ?? ""} placeholder="Second CCN" />
          <GlassButton type="submit" variant="primary" size="md">
            Compare
          </GlassButton>
        </form>

        {(aCcn || bCcn) && <CompareResult a={sa} b={sb} aCcn={aCcn} bCcn={bCcn} />}
      </section>
    </>
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
      verdict = { kind: "conflict", text: `CONFLICT on ${overlap.join(", ")}` };
    } else if (overlap.length === 0) {
      verdict = { kind: "ok", text: "No overlapping days" };
    } else if (!ta || !tb) {
      verdict = { kind: "warn", text: "One section is async — verify manually" };
    } else {
      verdict = { kind: "ok", text: `Same days (${overlap.join(", ")}) but non-overlapping times` };
    }
  }

  const verdictStyle = verdict
    ? verdict.kind === "conflict"
      ? {
          background: "var(--cap-conflict-fill)",
          color: "var(--cap-conflict-text)",
          border: "1px solid var(--cap-conflict-border)",
          boxShadow: "var(--cap-conflict-glow)",
        }
      : verdict.kind === "warn"
        ? {
            background: "var(--cap-warn-fill)",
            color: "var(--cap-warn-text)",
            border: "1px solid var(--cap-warn-border)",
          }
        : {
            background: "var(--cap-open-fill)",
            color: "var(--cap-open-text)",
            border: "1px solid var(--cap-open-border)",
            boxShadow: "var(--cap-open-glow)",
          }
    : {};

  return (
    <>
      {missing.length > 0 && (
        <p style={{ ...text, color: "var(--cap-warn-text)", fontSize: "0.875rem", marginBottom: "1rem" }}>
          {missing.join(" · ")}. Has it been synced?{" "}
          <Link href="/find" style={{ color: "var(--glass-text)", textDecoration: "underline" }}>
            search
          </Link>
          .
        </p>
      )}

      {a && b && verdict && (
        <div
          style={{
            padding: "0.85rem 1.2rem",
            borderRadius: "var(--r-pill)",
            fontFamily: "var(--font-text)",
            fontWeight: 600,
            fontSize: "0.95rem",
            marginBottom: "1.5rem",
            display: "inline-block",
            ...verdictStyle,
          }}
        >
          {verdict.text}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.25rem" }}>
        <CompareCard s={a} />
        <CompareCard s={b} />
      </div>
    </>
  );
}

function CompareCard({ s }: { s: Section | null }) {
  if (!s) {
    return (
      <GlassCard elevation={1} radius="lg" padding="1.5rem 1.5rem 2rem" specular={false}>
        <p style={{ margin: 0, color: "var(--glass-text-faint)", textAlign: "center" }}>Enter a CCN above.</p>
      </GlassCard>
    );
  }
  return (
    <GlassCard elevation={2} radius="lg" padding="1.5rem">
      <div style={{ display: "flex", justifyContent: "space-between", gap: "0.75rem", alignItems: "flex-start" }}>
        <div style={{ minWidth: 0 }}>
          <p style={{ margin: 0, ...mono, fontSize: "0.7rem", color: "var(--glass-text-faint)" }}>CCN {s.ccn}</p>
          <Link
            href={`/class/${s.ccn}`}
            style={{ ...display("1.25rem"), color: "var(--glass-text)", textDecoration: "none", display: "inline-block", marginTop: "0.2rem" }}
          >
            {s.course_code} {s.section_type} {s.section_number}
          </Link>
          <p style={{ margin: "0.3rem 0 0", ...text, color: "var(--glass-text)", fontSize: "0.95rem" }}>{s.title}</p>
        </div>
        <SeatCapsule seats={s.open_seats ?? 0} />
      </div>
      <dl
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "0.65rem 1rem",
          marginTop: "1.25rem",
          fontFamily: "var(--font-text)",
          fontSize: "0.875rem",
        }}
      >
        <Field label="Instructors" value={s.instructors} colSpan />
        <Field label="Days" value={s.meeting_days} />
        <Field label="Time" value={s.meeting_time} />
        <Field label="Location" value={s.location} colSpan />
        <Field label="Units" value={s.units} />
        <Field label="Open seats" value={s.open_seats} />
      </dl>
    </GlassCard>
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
          fontSize: "0.625rem",
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          color: "var(--glass-text-faint)",
        }}
      >
        {label}
      </dt>
      <dd style={{ margin: "0.25rem 0 0", color: "var(--glass-text)" }}>
        {value === null || value === undefined || value === "" ? "—" : value}
      </dd>
    </div>
  );
}
