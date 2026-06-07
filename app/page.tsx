import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Pull a snapshot of stats just for the landing page hero.
  const { count: sectionsCount } = await supabase
    .from("sections")
    .select("ccn", { count: "exact", head: true });

  return (
    <main className="min-h-screen bg-black text-white">
      <header className="border-b border-zinc-900">
        <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-lg font-semibold">
            berkeleyclasses<span className="text-zinc-500">.com</span>
          </Link>
          <nav className="flex items-center gap-6 text-sm">
            <Link href="/find" className="hover:text-zinc-300">
              Search
            </Link>
            <Link href="/schedule" className="hover:text-zinc-300">
              Schedule builder
            </Link>
            <Link href="/compare" className="hover:text-zinc-300">
              Compare
            </Link>
            {user ? (
              <Link href="/saved" className="hover:text-zinc-300">
                My schedules
              </Link>
            ) : (
              <Link
                href="/auth/signin"
                className="rounded-md bg-white text-black px-3 py-1.5 font-medium hover:bg-zinc-200"
              >
                Sign in
              </Link>
            )}
          </nav>
        </div>
      </header>

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
          body="See every section a professor teaches across all 198 subject areas in one query."
        />
        <Feature
          title="What changed this week"
          body="See new sections, cancellations, instructor swaps, and enrollment moves since yesterday."
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
