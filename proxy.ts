import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { rateLimit, clientIp } from "@/lib/rate-limit";

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  if (path.startsWith("/auth/signin") || path.startsWith("/auth/callback")) {
    const ip = clientIp(request);
    const r = rateLimit(`auth:${ip}`, 10, 60_000);
    if (!r.ok) {
      return new NextResponse("Too many sign-in attempts. Try again in a minute.", {
        status: 429,
        headers: { "Retry-After": String(r.retryAfter) },
      });
    }
  }
  return await updateSession(request);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
