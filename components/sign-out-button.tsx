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
      className="text-zinc-400 hover:text-white"
    >
      Sign out
    </button>
  );
}
