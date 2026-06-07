"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function StarButton({
  ccn,
  variant = "full",
}: {
  ccn: number;
  variant?: "full" | "icon";
}) {
  const router = useRouter();
  const [starred, setStarred] = useState<boolean | null>(null);
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [busy, startTransition] = useTransition();

  useEffect(() => {
    const supabase = createClient();
    let cancel = false;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (cancel) return;
      if (!user) {
        setAuthed(false);
        setStarred(false);
        return;
      }
      setAuthed(true);
      const { data } = await supabase
        .from("starred_sections")
        .select("ccn")
        .eq("ccn", ccn)
        .maybeSingle();
      if (!cancel) setStarred(!!data);
    })();
    return () => { cancel = true; };
  }, [ccn]);

  function toggle(e?: React.MouseEvent) {
    e?.preventDefault();
    e?.stopPropagation();
    if (authed === false) {
      router.push(`/auth/signin?next=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    startTransition(async () => {
      const supabase = createClient();
      if (starred) {
        const { error } = await supabase.from("starred_sections").delete().eq("ccn", ccn);
        if (!error) setStarred(false);
      } else {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { error } = await supabase
          .from("starred_sections")
          .insert({ user_id: user.id, ccn });
        if (!error) setStarred(true);
      }
    });
  }

  const filled = !!starred;
  const ariaLabel = filled ? "Remove star" : "Star this class";

  if (variant === "icon") {
    return (
      <button
        type="button"
        onClick={toggle}
        disabled={busy || starred === null}
        aria-label={ariaLabel}
        title={ariaLabel}
        className="p-1.5 rounded-md hover:bg-zinc-900 disabled:opacity-40 text-zinc-400 hover:text-yellow-300 disabled:cursor-wait"
      >
        <StarGlyph filled={filled} />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={busy || starred === null}
      aria-label={ariaLabel}
      className={
        "inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium transition-colors " +
        (filled
          ? "bg-yellow-500/10 border-yellow-500/40 text-yellow-200 hover:bg-yellow-500/20"
          : "border-zinc-700 text-zinc-200 hover:border-zinc-500")
      }
    >
      <StarGlyph filled={filled} />
      {filled ? "Starred" : "Star"}
    </button>
  );
}

function StarGlyph({ filled }: { filled: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}
