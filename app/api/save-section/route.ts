import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = (await req.json().catch(() => null)) as { ccn?: string } | null;
  const ccn = body?.ccn?.trim();
  if (!ccn) return NextResponse.json({ error: "missing ccn" }, { status: 400 });

  const { error } = await supabase
    .from("saved_sections")
    .upsert({ user_id: user.id, ccn });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = (await req.json().catch(() => null)) as { ccn?: string } | null;
  const ccn = body?.ccn?.trim();
  if (!ccn) return NextResponse.json({ error: "missing ccn" }, { status: 400 });

  const { error } = await supabase
    .from("saved_sections")
    .delete()
    .eq("user_id", user.id)
    .eq("ccn", ccn);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
