"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/glass";

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
    <Button type="button" size="sm" onClick={unsub} disabled={busy}>
      Unwatch
    </Button>
  );
}
