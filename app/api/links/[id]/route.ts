import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { action } = await request.json();
  if (!["accept", "reject"].includes(action)) return NextResponse.json({ error: "Invalid action" }, { status: 400 });

  const { id } = await params;
  const { error } = await supabase
    .from("account_links")
    .update({ status: action === "accept" ? "accepted" : "rejected" })
    .eq("id", id)
    .eq("recipient_id", user.id);

  if (error) return NextResponse.json({ error: "Failed to update." }, { status: 500 });
  return NextResponse.json({ ok: true });
}
