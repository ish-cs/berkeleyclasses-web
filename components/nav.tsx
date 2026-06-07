import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import SignOutButton from "./sign-out-button";

export default async function Nav() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <header className="border-b border-zinc-900 sticky top-0 z-40 bg-black/80 backdrop-blur">
      <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
        <Link href="/" className="text-lg font-semibold">
          berkeleyclasses<span className="text-zinc-500">.com</span>
        </Link>
        <nav className="flex items-center gap-5 text-sm">
          <Link href="/find" className="hover:text-zinc-300">
            Search
          </Link>
          <Link href="/schedule" className="hover:text-zinc-300">
            Schedule builder
          </Link>
          <Link href="/compare" className="hover:text-zinc-300">
            Compare
          </Link>
          {user ? (
            <>
              <Link href="/saved" className="hover:text-zinc-300">
                Saved
              </Link>
              <SignOutButton />
            </>
          ) : (
            <Link
              href="/auth/signin"
              className="rounded-md bg-white text-black px-3 py-1.5 font-medium hover:bg-zinc-200"
            >
              Sign in
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
