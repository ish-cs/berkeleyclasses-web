import { createClient } from "@/lib/supabase/server";
import {  } from "@/components/glass";
import GlassNav from "@/components/glass/GlassNav";
import ScheduleBuilder from "./builder";
import { groupTermsByYear } from "@/lib/terms";

export const dynamic = "force-dynamic";

const WRAP: React.CSSProperties = { maxWidth: "1240px", margin: "0 auto", padding: "1.75rem 1.5rem 5rem" };
const display = (size: string, weight = 600): React.CSSProperties => ({
  fontFamily: "var(--font-display)",
  fontWeight: weight,
  letterSpacing: "var(--tracking-display)",
  fontSize: size,
});

export default async function SchedulePage() {
  const supabase = await createClient();
  const { data: termsRaw } = await supabase.from("terms").select("term_id, name");
  const termGroups = groupTermsByYear(termsRaw ?? []);

  return (
    <>
      <GlassNav />
      <section style={WRAP}>
        <h1 style={{ margin: 0, ...display("2rem"), color: "var(--glass-text)" }}>Schedule builder</h1>
        <p
          style={{
            margin: "0.4rem 0 2rem",
            fontFamily: "var(--font-text)",
            color: "var(--glass-text-muted)",
            maxWidth: "60ch",
          }}
        >
          Add courses to your wishlist. We&apos;ll find every valid combination of sections with no time conflicts.
        </p>
        <ScheduleBuilder termGroups={termGroups} />
      </section>
    </>
  );
}
