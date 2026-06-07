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
      style={{
        background: "transparent",
        border: "none",
        cursor: "pointer",
        color: "var(--glass-text-faint)",
        fontFamily: "var(--font-text)",
        fontSize: "0.8125rem",
        opacity: busy ? 0.5 : 1,
      }}
    >
      Unwatch
    </button>
  );
}
