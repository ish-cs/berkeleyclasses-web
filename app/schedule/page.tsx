import { createClient } from "@/lib/supabase/server";
import Nav from "@/components/nav";
import ScheduleBuilder from "./builder";
import { sortTermsByYear } from "@/lib/terms";

export const dynamic = "force-dynamic";

export default async function SchedulePage() {
  const supabase = await createClient();
  const { data: termsRaw } = await supabase
    .from("terms")
    .select("term_id, name");
  const terms = sortTermsByYear(termsRaw ?? []);
  return (
    <main className="min-h-screen bg-black text-white">
      <Nav />
      <section className="mx-auto max-w-6xl px-6 py-10">
        <h1 className="text-3xl font-semibold mb-2">Schedule builder</h1>
        <p className="text-zinc-500 mb-8">
          Add courses to your wishlist. We&apos;ll find every valid combination of sections with
          no time conflicts.
        </p>
        <ScheduleBuilder terms={terms} />
      </section>
    </main>
  );
}
