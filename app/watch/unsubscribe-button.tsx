"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function UnsubscribeButton({ id }: { id: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  async function unsub() {
    setBusy(true);
    const supabase = createClient();
    await supabase.from("watch_subscriptions").delete().eq("id", id);
    router.refresh();
  }
  return (
    <button
      type="button"
      onClick={unsub}
      disabled={busy}
      className="text-sm text-zinc-500 hover:text-red-400 disabled:opacity-50"
    >
      Unwatch
    </button>
  );
}
