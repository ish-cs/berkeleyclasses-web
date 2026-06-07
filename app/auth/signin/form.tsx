"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { GlassCard, GlassButton } from "@/components/glass";

const WRAP: React.CSSProperties = { maxWidth: "480px", margin: "0 auto", padding: "5rem 1.5rem 4rem" };
const display = (size: string, weight = 600): React.CSSProperties => ({
  fontFamily: "var(--font-display)",
  fontWeight: weight,
  letterSpacing: "var(--tracking-display)",
  fontSize: size,
});
const text: React.CSSProperties = { fontFamily: "var(--font-text)", color: "var(--glass-text-muted)" };

export default function SignInForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") ?? "/";
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) router.replace(next);
    });
  }, [router, next]);

  async function signInWithGoogle() {
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
        queryParams: { hd: "berkeley.edu", prompt: "select_account" },
      },
    });
    if (error) {
      setError(error.message);
      setLoading(false);
    }
  }

  return (
    <main style={WRAP}>
      <GlassCard elevation={2} radius="lg" padding="2.25rem">
        <h1 style={{ margin: 0, ...display("1.85rem"), color: "var(--glass-text)" }}>Sign in</h1>
        <p style={{ margin: "0.75rem 0 1.75rem", ...text, lineHeight: 1.5 }}>
          Use your <span style={{ color: "var(--glass-text)" }}>@berkeley.edu</span> Google account to save schedules
          and watch waitlists.
        </p>
        <GlassButton variant="primary" size="lg" disabled={loading} onClick={signInWithGoogle} style={{ width: "100%" }}>
          {loading ? "Redirecting…" : "Continue with Google"}
        </GlassButton>
        {error && (
          <p style={{ marginTop: "1rem", color: "var(--cap-conflict-text)", fontSize: "0.875rem" }}>{error}</p>
        )}
        <p style={{ marginTop: "1.5rem", ...text, fontSize: "0.85rem", lineHeight: 1.5 }}>
          Browse, search, and build schedules without signing in. Sign-in is only needed to save and get waitlist
          alerts.
        </p>
      </GlassCard>
      <p style={{ margin: "1.5rem 0 0", textAlign: "center", ...text, fontSize: "0.8rem" }}>
        <Link href="/" style={{ color: "var(--glass-text-faint)", textDecoration: "none" }}>
          ← Back home
        </Link>
      </p>
    </main>
  );
}
