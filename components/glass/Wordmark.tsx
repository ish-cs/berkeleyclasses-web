import Link from "next/link";

export function Wordmark({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="bc-wordmark">
      berkeleyclasses<span className="bc-wordmark-dot">.</span>
    </Link>
  );
}
