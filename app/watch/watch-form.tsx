"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

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
    const { data: { user } } = await supabase.auth.getUser();
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
    if (insErr) {
      setError(insErr.message);
    } else {
      setCcn("");
      router.refresh();
    }
    setLoading(false);
  }

  return (
    <div className="rounded-lg border border-zinc-900 p-5">
      <p className="text-sm text-zinc-400 mb-3">
        Notifications go to <span className="text-white">{userEmail || "your account email"}</span>.
      </p>
      <div className="flex gap-2">
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={ccn}
          onChange={(e) => setCcn(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && subscribe()}
          placeholder="CCN to watch (e.g. 29147)"
          className="flex-1 rounded-md bg-zinc-900 border border-zinc-800 px-3 py-2 outline-none focus:border-zinc-500"
        />
        <button
          type="button"
          onClick={subscribe}
          disabled={loading}
          className="rounded-md bg-white text-black px-4 py-2 font-medium hover:bg-zinc-200 disabled:opacity-50"
        >
          {loading ? "Adding…" : "Watch"}
        </button>
      </div>
      {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
    </div>
  );
}
