import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: links } = await supabase
    .from("account_links")
    .select("id, requester_id, status, created_at")
    .eq("recipient_id", user.id)
    .eq("status", "pending");

  const result = [];
  for (const link of links ?? []) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("id", link.requester_id)
      .single();
    result.push({ id: link.id, name: profile?.display_name ?? "Someone" });
  }

  return NextResponse.json({ requests: result });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { email } = await request.json();
  if (!email?.trim()) return NextResponse.json({ error: "Email required" }, { status: 400 });

  // Look up user ID by email via a database function (no service role key needed)
  const { data: targetId, error: lookupError } = await supabase.rpc("get_user_id_by_email", {
    user_email: email.trim().toLowerCase(),
  });

  if (lookupError || !targetId) {
    return NextResponse.json({ error: "No Haven account found for that email." }, { status: 404 });
  }
  if (targetId === user.id) return NextResponse.json({ error: "Can't link with yourself." }, { status: 400 });

  const { data: existing } = await supabase
    .from("account_links")
    .select("id, status")
    .or(`and(requester_id.eq.${user.id},recipient_id.eq.${targetId}),and(requester_id.eq.${targetId},recipient_id.eq.${user.id})`)
    .limit(1);

  if (existing?.length) {
    const s = existing[0].status;
    if (s === "accepted") return NextResponse.json({ error: "Already connected." }, { status: 400 });
    if (s === "pending") return NextResponse.json({ error: "Request already sent." }, { status: 400 });
  }

  const { error: insertError } = await supabase
    .from("account_links")
    .insert({ requester_id: user.id, recipient_id: targetId });

  if (insertError) return NextResponse.json({ error: "Failed to send request." }, { status: 500 });

  const { data: targetProfile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", targetId)
    .single();

  return NextResponse.json({ recipientName: targetProfile?.display_name ?? email });
}

