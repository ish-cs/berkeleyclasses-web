"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Glass, Button } from "@/components/glass";

export default function WatchForm({
  initialCcn,
  userEmail,
}: {
  initialCcn?: number;
  userEmail: string;
}) {
  const router = useRouter();
  const [ccn, setCcn] = useState(initialCcn ? String(initialCcn) : "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function subscribe() {
    setError(null);
    const n = parseInt(ccn, 10);
    if (Number.isNaN(n) || n <= 0) {
      setError("CCN must be a positive integer.");
      return;
    }
    setLoading(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      window.location.href = "/auth/signin?next=/watch";
      return;
    }
    const { data: section } = await supabase.from("sections").select("ccn").eq("ccn", n).maybeSingle();
    if (!section) {
      setError(`CCN ${n} not found — it may not have been synced yet.`);
      setLoading(false);
      return;
    }
    const { error: insErr } = await supabase
      .from("watch_subscriptions")
      .upsert({ user_id: user.id, ccn: n, email_on_open: true }, { onConflict: "user_id,ccn" });
    if (insErr) setError(insErr.message);
    else {
      setCcn("");
      router.refresh();
    }
    setLoading(false);
  }

  return (
    <Glass style={{ padding: "20px 24px" }}>
      <p style={{ margin: "0 0 12px", fontSize: 13, color: "var(--muted)" }}>
        Notifications go to <strong style={{ color: "var(--ink-strong)" }}>{userEmail || "your account email"}</strong>.
      </p>
      <div className="bc-watch-form-row">
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={ccn}
          onChange={(e) => setCcn(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && subscribe()}
          placeholder="CCN to watch (e.g. 29147)"
          className="bc-input"
        />
        <Button variant="primary" disabled={loading} onClick={subscribe}>
          {loading ? "Adding…" : "Watch"}
        </Button>
      </div>
      {error && (
        <p style={{ margin: "12px 0 0", color: "var(--cap-conflict-text)", fontSize: 13 }}>
          {error}
        </p>
      )}
    </Glass>
  );
}
