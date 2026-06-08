import { Glass } from "./Glass";
import { Wordmark } from "./Wordmark";
import { ThemeToggle } from "./ThemeToggle";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

const ITEMS = [
  { href: "/find", label: "Find" },
  { href: "/schedule", label: "Schedule" },
  { href: "/compare", label: "Compare" },
  { href: "/watch", label: "Watch" },
  { href: "/saved", label: "Saved" },
];

export default async function GlassNav({ active }: { active?: string }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return (
    <Glass as="header" className="bc-nav">
      <Wordmark />
      <nav className="bc-nav-links">
        {ITEMS.map((it) => (
          <Link
            key={it.href}
            href={it.href}
            className={["bc-nav-link", active === it.href ? "bc-nav-link--on" : null].filter(Boolean).join(" ")}
          >
            {it.label}
          </Link>
        ))}
      </nav>
      <div className="bc-nav-right">
        <span className="bc-nav-term">Fall 2026</span>
        <ThemeToggle />
        {user ? <div className="bc-avatar" /> : <Link href="/auth/signin" className="bc-nav-link">Sign in</Link>}
      </div>
    </Glass>
  );
}
