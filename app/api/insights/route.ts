import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data } = await supabase
    .from("profile_insights")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  return NextResponse.json({ insights: data ?? [] });
}

export async function DELETE(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await request.json();
  await supabase.from("profile_insights").delete().eq("id", id).eq("user_id", user.id);
  return NextResponse.json({ ok: true });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { category, text } = await request.json();
  const { data } = await supabase
    .from("profile_insights")
    .insert({ user_id: user.id, category, text })
    .select()
    .single();

  return NextResponse.json({ insight: data });
}
