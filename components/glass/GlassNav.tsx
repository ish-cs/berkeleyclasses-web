import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import GlassWordmark from "./GlassWordmark";
import SignOutButton from "@/components/sign-out-button";

const LINKS = [
  { href: "/find", label: "Search" },
  { href: "/schedule", label: "Schedule" },
  { href: "/compare", label: "Compare" },
];

export default async function GlassNav() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        background: "rgba(10,14,24,0.55)",
        backdropFilter: "blur(var(--glass-blur-strong)) saturate(var(--glass-saturate))",
        WebkitBackdropFilter: "blur(var(--glass-blur-strong)) saturate(var(--glass-saturate))",
        borderBottom: "1px solid var(--glass-border)",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.18), 0 4px 24px rgba(0,0,0,0.35)",
      }}
    >
      <div
        style={{
          maxWidth: "1240px",
          margin: "0 auto",
          padding: "0.85rem 1.25rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "1rem",
        }}
      >
        <Link href="/" style={{ display: "inline-flex" }}>
          <GlassWordmark />
        </Link>
        <nav style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="hover:text-white"
              style={{
                fontFamily: "var(--font-text)",
                fontSize: "0.875rem",
                fontWeight: 600,
                padding: "0.4rem 0.85rem",
                borderRadius: "var(--r-pill)",
                whiteSpace: "nowrap",
                color: "var(--glass-text-muted)",
                transition: "all var(--dur) var(--spring-soft)",
              }}
            >
              {l.label}
            </Link>
          ))}
          {user ? (
            <>
              <Link
                href="/saved"
                style={{
                  fontFamily: "var(--font-text)",
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  padding: "0.4rem 0.85rem",
                  borderRadius: "var(--r-pill)",
                  color: "var(--glass-text-muted)",
                }}
              >
                Saved
              </Link>
              <SignOutButton />
            </>
          ) : (
            <Link
              href="/auth/signin"
              style={{
                marginLeft: "0.35rem",
                fontFamily: "var(--font-text)",
                fontSize: "0.875rem",
                fontWeight: 600,
                whiteSpace: "nowrap",
                padding: "0.45rem 1rem",
                borderRadius: "var(--r-pill)",
                color: "#fff",
                background: "linear-gradient(180deg, rgba(74,144,217,0.42), rgba(0,50,98,0.55))",
                border: "1px solid rgba(120,180,240,0.5)",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.35), 0 0 16px -4px rgba(74,144,217,0.5)",
              }}
            >
              Sign in
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
