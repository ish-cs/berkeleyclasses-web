import { createClient } from "@/lib/supabase/server";
import Nav from "@/components/nav";
import ScheduleBuilder from "./builder";
import { groupTermsByYear } from "@/lib/terms";

export const dynamic = "force-dynamic";

export default async function SchedulePage() {
  const supabase = await createClient();
  const { data: termsRaw } = await supabase
    .from("terms")
    .select("term_id, name");
  const termGroups = groupTermsByYear(termsRaw ?? []);
  return (
    <main className="min-h-screen bg-black text-white">
      <Nav />
      <section className="mx-auto max-w-6xl px-4 sm:px-6 py-8 sm:py-10">
        <h1 className="text-2xl sm:text-3xl font-semibold mb-2">Schedule builder</h1>
        <p className="text-zinc-500 mb-6 sm:mb-8 text-sm sm:text-base">
          Add courses to your wishlist. We&apos;ll find every valid combination of sections with
          no time conflicts.
        </p>
        <ScheduleBuilder termGroups={termGroups} />
      </section>
    </main>
  );
}
