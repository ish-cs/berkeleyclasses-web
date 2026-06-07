"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function SignOutButton() {
  const router = useRouter();

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={signOut}
      style={{
        background: "transparent",
        border: "none",
        cursor: "pointer",
        fontFamily: "var(--font-text)",
        fontSize: "0.875rem",
        fontWeight: 600,
        color: "var(--glass-text-muted)",
        padding: "0.4rem 0.85rem",
        borderRadius: "var(--r-pill)",
      }}
    >
      Sign out
    </button>
  );
}
