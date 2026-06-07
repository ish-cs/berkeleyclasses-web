import { Suspense } from "react";
import SignInForm from "./form";
import {  } from "@/components/glass";
import GlassNav from "@/components/glass/GlassNav";

export default function SignInPage() {
  return (
    <>
      <GlassNav />
      <Suspense
        fallback={
          <main style={{ maxWidth: "480px", margin: "0 auto", padding: "5rem 1.5rem", color: "var(--glass-text)" }}>
            Loading…
          </main>
        }
      >
        <SignInForm />
      </Suspense>
    </>
  );
}
