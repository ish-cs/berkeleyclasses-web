import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Glass, Button } from "@/components/glass";
import GlassNav from "@/components/glass/GlassNav";

export const dynamic = "force-dynamic";

const FEATURES: { title: string; body: string }[] = [
  { title: "Conflict-free schedule builder", body: "Pick the courses you want. We compute every valid combination — no time conflicts." },
  { title: "Waitlist watcher", body: "Subscribe to a CCN. We email you the second a seat opens or the waitlist shrinks." },
  { title: "Compare two sections", body: "Side-by-side: instructors, times, locations, units, enrollment, plus a conflict verdict." },
  { title: "Instructor search", body: "See every section a professor teaches across every subject area in one query." },
  { title: "Grade distributions", body: "See the historical GPA average and grade histogram before you enroll." },
  { title: "Save your schedules", body: "Save unlimited schedules to your @berkeley.edu account. Share a link with friends." },
];

export default async function Home() {
  const supabase = await createClient();
  const { count: sectionsCount } = await supabase
    .from("sections")
    .select("ccn", { count: "exact", head: true });
  const { count: subjectsCount } = await supabase
    .from("subjects")
    .select("subject_id", { count: "exact", head: true });

  return (
    <main className="bc-page">
      <GlassNav active="/" />

      <Glass className="bc-hero bc-hero--landing">
        <div className="bc-eyebrow">UC Berkeley · classes.berkeley.edu</div>
        <h1 className="bc-h1 bc-h1--xl">
          The Berkeley schedule, <span className="bc-h1-accent">the way it should be.</span>
        </h1>
        <p className="bc-lede">
          Search every section, build conflict-free schedules in one click, compare classes
          side-by-side, and get pinged the moment a seat opens. Free, fast, accurate.
        </p>
        <div className="bc-cta-row">
          <Link href="/find"><Button variant="primary" size="lg">Search classes →</Button></Link>
          <Link href="/schedule"><Button size="lg">Build a schedule</Button></Link>
        </div>
        {sectionsCount != null && (
          <p className="bc-stat-line">
            {sectionsCount.toLocaleString()} sections indexed
            {subjectsCount ? ` · ${subjectsCount} subjects` : ""}
          </p>
        )}
      </Glass>

      <div className="bc-features">
        {FEATURES.map((f) => (
          <Glass key={f.title} className="bc-feature">
            <h3>{f.title}</h3>
            <p>{f.body}</p>
          </Glass>
        ))}
      </div>

      <footer className="bc-footer">
        <span>Not affiliated with UC Berkeley. Data from classes.berkeley.edu.</span>
        <a href="https://github.com/ish-cs/berkeley-classes-cli" target="_blank" rel="noopener noreferrer">CLI on GitHub</a>
      </footer>
    </main>
  );
}
