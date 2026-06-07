"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { GlassCard, GlassButton, GlassInput } from "@/components/glass";

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
    <GlassCard elevation={1} radius="lg" padding="1.4rem">
      <p style={{ margin: "0 0 0.85rem", fontFamily: "var(--font-text)", fontSize: "0.875rem", color: "var(--glass-text-muted)" }}>
        Notifications go to <span style={{ color: "var(--glass-text)" }}>{userEmail || "your account email"}</span>.
      </p>
      <div style={{ display: "flex", gap: "0.55rem" }}>
        <GlassInput
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={ccn}
          onChange={(e) => setCcn(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && subscribe()}
          placeholder="CCN to watch (e.g. 29147)"
        />
        <GlassButton variant="primary" size="md" disabled={loading} onClick={subscribe}>
          {loading ? "Adding…" : "Watch"}
        </GlassButton>
      </div>
      {error && (
        <p style={{ margin: "0.85rem 0 0", color: "var(--cap-conflict-text)", fontSize: "0.875rem", fontFamily: "var(--font-text)" }}>
          {error}
        </p>
      )}
    </GlassCard>
  );
}
