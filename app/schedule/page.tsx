import { createClient } from "@/lib/supabase/server";
import { Glass } from "@/components/glass";
import GlassNav from "@/components/glass/GlassNav";
import ScheduleBuilder from "./builder";
import { groupTermsByYear } from "@/lib/terms";

export const dynamic = "force-dynamic";

export default async function SchedulePage() {
  const supabase = await createClient();
  const { data: termsRaw } = await supabase.from("terms").select("term_id, name");
  const termGroups = groupTermsByYear(termsRaw ?? []);

  return (
    <main className="bc-page">
      <GlassNav active="/schedule" />
      <Glass className="bc-hero">
        <div className="bc-eyebrow">Schedule builder · Fall 2026</div>
        <h1 className="bc-h1">Build a <span className="bc-h1-accent">conflict-free</span> schedule.</h1>
        <p className="bc-lede">
          Add courses to your wishlist. We&apos;ll find every valid combination of sections with
          no time conflicts. Export to .ics when you&apos;re done.
        </p>
      </Glass>
      <ScheduleBuilder termGroups={termGroups} />
    </main>
  );
}
