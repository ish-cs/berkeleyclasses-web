"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { GlassButton } from "@/components/glass";

export default function DeleteScheduleButton({ id }: { id: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function del() {
    if (!confirm("Delete this schedule?")) return;
    setBusy(true);
    const supabase = createClient();
    await supabase.from("saved_schedules").delete().eq("id", id);
    router.refresh();
  }

  return (
    <GlassButton type="button" variant="ghost" size="sm" onClick={del} disabled={busy}>
      Delete
    </GlassButton>
  );
}
