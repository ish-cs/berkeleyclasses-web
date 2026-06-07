"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

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
    <button
      type="button"
      onClick={del}
      disabled={busy}
      className="text-sm text-zinc-500 hover:text-red-400 disabled:opacity-50 shrink-0"
    >
      Delete
    </button>
  );
}
