import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import Nav from "@/components/nav";

export const dynamic = "force-dynamic";

export default async function Home() {
  const supabase = await createClient();

  const { count: sectionsCount } = await supabase
    .from("sections")
    .select("ccn", { count: "exact", head: true });

  return (
    <main className="min-h-screen bg-black text-white">
      <Nav />

      <section className="mx-auto max-w-6xl px-6 py-24">
        <h1 className="text-5xl md:text-6xl font-semibold tracking-tight leading-tight max-w-3xl">
          The UC Berkeley class schedule, the way it should be.
        </h1>
        <p className="mt-6 text-lg text-zinc-400 max-w-2xl">
          Search every section, build conflict-free schedules in one click, compare two classes
          side-by-side, and get emailed the moment a seat opens. Free, fast, accurate.
        </p>
        <div className="mt-10 flex flex-wrap gap-3">
          <Link
            href="/find"
            className="rounded-md bg-white text-black px-5 py-3 font-medium hover:bg-zinc-200"
          >
            Search classes →
          </Link>
          <Link
            href="/schedule"
            className="rounded-md border border-zinc-700 px-5 py-3 font-medium hover:border-zinc-500"
          >
            Build a schedule
          </Link>
        </div>
        {sectionsCount !== null && (
          <p className="mt-8 text-sm text-zinc-500">
            {sectionsCount.toLocaleString()} sections indexed.
          </p>
        )}
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16 border-t border-zinc-900 grid md:grid-cols-3 gap-10">
        <Feature
          title="Conflict-free schedule builder"
          body="Pick the courses you want. We compute every valid combination — no time conflicts."
        />
        <Feature
          title="Waitlist watcher"
          body="Subscribe to a CCN. We email you the second a seat opens or the waitlist shrinks."
        />
        <Feature
          title="Compare two sections"
          body="Side-by-side: instructors, times, locations, units, enrollment, plus a conflict verdict."
        />
        <Feature
          title="Cross-department instructor search"
          body="See every section a professor teaches across every subject area in one query."
        />
        <Feature
          title="Grade distributions"
          body="See the historical GPA average and grade histogram for any course, sourced from Berkeleytime, before you enroll."
        />
        <Feature
          title="Save your schedules"
          body="Save unlimited schedules to your @berkeley.edu account. Share a link with friends."
        />
      </section>

      <footer className="border-t border-zinc-900 py-10 text-sm text-zinc-500">
        <div className="mx-auto max-w-6xl px-6 flex items-center justify-between">
          <span>Not affiliated with UC Berkeley. Data from classes.berkeley.edu.</span>
          <a
            href="https://github.com/ish-cs/berkeley-classes-cli"
            className="hover:text-zinc-300"
            target="_blank"
            rel="noopener noreferrer"
          >
            CLI on GitHub
          </a>
        </div>
      </footer>
    </main>
  );
}

function Feature({ title, body }: { title: string; body: string }) {
  return (
    <div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-zinc-400">{body}</p>
    </div>
  );
}
