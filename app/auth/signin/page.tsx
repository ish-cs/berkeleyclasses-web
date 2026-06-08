import { Suspense } from "react";
import SignInForm from "./form";

export default function SignInPage() {
  return (
    <Suspense
      fallback={
        <div className="bc-auth-shell">
          <div style={{ color: "var(--muted)", fontSize: 14 }}>Loading…</div>
        </div>
      }
    >
      <SignInForm />
    </Suspense>
  );
}
