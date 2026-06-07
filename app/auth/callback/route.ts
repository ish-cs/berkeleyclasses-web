import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (!code) {
    return NextResponse.redirect(`${origin}/auth/error?reason=no_code`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    // The @berkeley.edu trigger raises this for non-Berkeley emails.
    if (error.message.includes("@berkeley.edu")) {
      await supabase.auth.signOut();
      return NextResponse.redirect(`${origin}/auth/error?reason=not_berkeley`);
    }
    return NextResponse.redirect(`${origin}/auth/error?reason=${encodeURIComponent(error.message)}`);
  }

  return NextResponse.redirect(`${origin}${next}`);
}
