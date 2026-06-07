"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

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
        queryParams: {
          hd: "berkeley.edu",
          prompt: "select_account",
        },
      },
    });
    if (error) {
      setError(error.message);
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-md px-6 py-24">
      <h1 className="text-3xl font-semibold mb-2">Sign in</h1>
      <p className="text-gray-400 mb-8">
        Use your <span className="text-white">@berkeley.edu</span> Google account to save schedules
        and watch waitlists.
      </p>
      <button
        type="button"
        onClick={signInWithGoogle}
        disabled={loading}
        className="w-full rounded-md bg-white text-black px-4 py-3 font-medium hover:bg-gray-200 disabled:opacity-50"
      >
        {loading ? "Redirecting…" : "Continue with Google"}
      </button>
      {error && <p className="mt-4 text-sm text-red-400">{error}</p>}
      <p className="mt-6 text-sm text-gray-500">
        Browse, search, and build schedules without signing in. Sign-in is only needed to save and
        get waitlist alerts.
      </p>
    </main>
  );
}
