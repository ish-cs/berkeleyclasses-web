import Link from "next/link";
import {  GlassCard, GlassButton } from "@/components/glass";
import GlassNav from "@/components/glass/GlassNav";

const WRAP: React.CSSProperties = { maxWidth: "480px", margin: "0 auto", padding: "5rem 1.5rem 4rem" };
const display = (size: string, weight = 600): React.CSSProperties => ({
  fontFamily: "var(--font-display)",
  fontWeight: weight,
  letterSpacing: "var(--tracking-display)",
  fontSize: size,
});
const text: React.CSSProperties = { fontFamily: "var(--font-text)", color: "var(--glass-text-muted)" };

const REASONS: Record<string, { title: string; body: string }> = {
  not_berkeley: {
    title: "Berkeley accounts only",
    body: "berkeleyclasses.com signs in with @berkeley.edu Google accounts. Switch to your Berkeley account and try again.",
  },
  no_code: {
    title: "Sign-in interrupted",
    body: "The sign-in flow didn't finish. Try again.",
  },
};

export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string }>;
}) {
  const { reason } = await searchParams;
  const copy = REASONS[reason ?? ""] ?? {
    title: "Sign-in failed",
    body: reason ?? "Unknown error. Try again in a moment.",
  };

  return (
    <>
      <GlassNav />
      <main style={WRAP}>
        <GlassCard elevation={2} radius="lg" padding="2.25rem">
          <h1 style={{ margin: 0, ...display("1.85rem"), color: "var(--glass-text)" }}>{copy.title}</h1>
          <p style={{ margin: "0.75rem 0 1.75rem", ...text, lineHeight: 1.5 }}>{copy.body}</p>
          <Link href="/" style={{ textDecoration: "none" }}>
            <GlassButton variant="primary" size="md">
              Back to home
            </GlassButton>
          </Link>
        </GlassCard>
      </main>
    </>
  );
}
