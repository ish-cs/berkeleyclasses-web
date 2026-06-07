import { Suspense } from "react";
import SignInForm from "./form";

export default function SignInPage() {
  return (
    <Suspense fallback={<main className="mx-auto max-w-md px-6 py-24">Loading…</main>}>
      <SignInForm />
    </Suspense>
  );
}
