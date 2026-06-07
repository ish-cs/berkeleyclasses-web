import Link from "next/link";

const reasonCopy: Record<string, { title: string; body: string }> = {
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
  const copy = reasonCopy[reason ?? ""] ?? {
    title: "Sign-in failed",
    body: reason ?? "Unknown error. Try again in a moment.",
  };

  return (
    <main className="mx-auto max-w-md px-6 py-24">
      <h1 className="text-2xl font-semibold mb-3">{copy.title}</h1>
      <p className="text-gray-300 mb-8">{copy.body}</p>
      <Link
        href="/"
        className="inline-block rounded-md bg-white text-black px-4 py-2 font-medium hover:bg-gray-200"
      >
        Back to home
      </Link>
    </main>
  );
}
