import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {  GlassCard, GlassButton } from "@/components/glass";
import GlassNav from "@/components/glass/GlassNav";

export const dynamic = "force-dynamic";

const WRAP: React.CSSProperties = {
  maxWidth: "1240px",
  margin: "0 auto",
  padding: "0 1.5rem",
};

const display = (size: string, weight = 600): React.CSSProperties => ({
  fontFamily: "var(--font-display)",
  fontWeight: weight,
  letterSpacing: "var(--tracking-display)",
  fontSize: size,
});

const text: React.CSSProperties = {
  fontFamily: "var(--font-text)",
  color: "var(--glass-text-muted)",
};

const mono: React.CSSProperties = { fontFamily: "var(--font-mono-sf)" };

const FEATURES: { title: string; body: string; tint: string }[] = [
  ["Conflict-free schedule builder", "Pick the courses you want. We compute every valid combination — no time conflicts.", "var(--subj-1)"],
  ["Waitlist watcher", "Subscribe to a CCN. We email you the second a seat opens or the waitlist shrinks.", "var(--subj-3)"],
  ["Compare two sections", "Side-by-side: instructors, times, locations, units, enrollment, plus a conflict verdict.", "var(--subj-2)"],
  ["Cross-department instructor search", "See every section a professor teaches across every subject area in one query.", "var(--subj-4)"],
  ["Grade distributions", "See the historical GPA average and grade histogram before you enroll.", "var(--subj-6)"],
  ["Save your schedules", "Save unlimited schedules to your @berkeley.edu account. Share a link with friends.", "var(--subj-5)"],
].map(([title, body, tint]) => ({ title, body, tint }));

export default async function Home() {
  const supabase = await createClient();
  const { count: sectionsCount } = await supabase
    .from("sections")
    .select("ccn", { count: "exact", head: true });
  const { count: subjectsCount } = await supabase
    .from("subjects")
    .select("subject_id", { count: "exact", head: true });

  return (
    <>
      <GlassNav />
      <main>
        <section style={{ ...WRAP, paddingTop: "5.5rem", paddingBottom: "4rem" }}>
          <GlassCard elevation={2} radius="xl" padding="3rem" tint="var(--subj-1)">
            <p
              style={{
                margin: "0 0 1.25rem",
                fontSize: "0.8rem",
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: "var(--glass-text-faint)",
                fontFamily: "var(--font-text)",
              }}
            >
              UC Berkeley · classes.berkeley.edu
            </p>
            <h1
              style={{
                margin: 0,
                ...display("clamp(2.4rem, 5.5vw, 4rem)", 600),
                lineHeight: 1.04,
                color: "var(--glass-text)",
                maxWidth: "16ch",
              }}
            >
              The Berkeley schedule, the way it should be.
            </h1>
            <p style={{ margin: "1.4rem 0 0", ...text, fontSize: "1.15rem", maxWidth: "46ch", lineHeight: 1.5 }}>
              Search every section, build conflict-free schedules in one click, compare classes side-by-side, and get
              pinged the moment a seat opens. Free, fast, accurate.
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", marginTop: "2rem" }}>
              <Link href="/find">
                <GlassButton variant="primary" size="lg">
                  Search classes →
                </GlassButton>
              </Link>
              <Link href="/schedule">
                <GlassButton variant="glass" size="lg">
                  Build a schedule
                </GlassButton>
              </Link>
            </div>
            {sectionsCount !== null && (
              <p style={{ margin: "1.6rem 0 0", ...mono, fontSize: "0.85rem", color: "var(--glass-text-faint)" }}>
                {sectionsCount.toLocaleString()} sections indexed
                {subjectsCount ? ` · ${subjectsCount} subjects` : ""}
              </p>
            )}
          </GlassCard>
        </section>

        <section style={{ ...WRAP, paddingBottom: "5rem" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: "1.25rem",
            }}
          >
            {FEATURES.map((f) => (
              <GlassCard key={f.title} elevation={1} radius="lg" padding="1.75rem" tint={f.tint}>
                <h3 style={{ margin: 0, ...display("1.15rem"), color: "var(--glass-text)" }}>{f.title}</h3>
                <p style={{ margin: "0.6rem 0 0", ...text, lineHeight: 1.55 }}>{f.body}</p>
              </GlassCard>
            ))}
          </div>
        </section>

        <footer
          style={{
            ...WRAP,
            padding: "2rem 1.5rem 3rem",
            ...text,
            fontSize: "0.85rem",
            display: "flex",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "0.5rem",
          }}
        >
          <span>Not affiliated with UC Berkeley. Data from classes.berkeley.edu.</span>
          <a
            href="https://github.com/ish-cs/berkeley-classes-cli"
            className="hover:text-white"
            target="_blank"
            rel="noopener noreferrer"
          >
            CLI on GitHub
          </a>
        </footer>
      </main>
    </>
  );
}
