import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { buildIcs } from "@/lib/ics";
import type { Section } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const raw = searchParams.get("ccns") ?? "";
  const name = (searchParams.get("name") ?? "schedule").replace(/[^a-z0-9_-]+/gi, "_").slice(0, 60) || "schedule";

  const ccns = raw
    .split(/[,\s]+/)
    .map((v) => parseInt(v, 10))
    .filter((n) => Number.isFinite(n) && n > 0);

  if (ccns.length === 0) {
    return NextResponse.json({ error: "Missing ?ccns=12345,67890" }, { status: 400 });
  }
  if (ccns.length > 30) {
    return NextResponse.json({ error: "Too many CCNs (max 30)" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase.from("sections").select("*").in("ccn", ccns);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const body = buildIcs((data ?? []) as Section[]);
  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${name}.ics"`,
      "Cache-Control": "no-store",
    },
  });
}
