"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Glass, Button } from "@/components/glass";

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
    <div className="bc-auth-shell">
      <Glass className="bc-auth-card">
        <h1>Sign in with your Berkeley account</h1>
        <p>
          Use your <strong>@berkeley.edu</strong> Google account to save schedules and watch sections.
        </p>
        {error && <div className="bc-auth-error">{error}</div>}
        <Button variant="primary" size="lg" disabled={loading} onClick={signInWithGoogle} style={{ width: "100%" }}>
          {loading ? "Redirecting…" : "Continue with Google"}
        </Button>
        <p style={{ marginTop: 16, fontSize: 12, color: "var(--muted)" }}>
          Browse and build schedules without signing in. Sign-in is only needed to save and get waitlist alerts.
        </p>
        <p style={{ marginTop: 12, fontSize: 12 }}>
          <Link href="/" style={{ color: "var(--muted)", textDecoration: "none" }}>
            ← Back home
          </Link>
        </p>
      </Glass>
    </div>
  );
}
