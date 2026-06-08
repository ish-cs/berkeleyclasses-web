import Link from "next/link";
import { Glass, Button } from "@/components/glass";

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
    <div className="bc-auth-shell">
      <Glass className="bc-auth-card">
        <h1>{copy.title}</h1>
        <div className="bc-auth-error">{copy.body}</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" as const }}>
          <Link href="/auth/signin" style={{ textDecoration: "none" }}>
            <Button variant="primary">Try again</Button>
          </Link>
          <Link href="/" style={{ textDecoration: "none" }}>
            <Button>Back to home</Button>
          </Link>
        </div>
      </Glass>
    </div>
  );
}
