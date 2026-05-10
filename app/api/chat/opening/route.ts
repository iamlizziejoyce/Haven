import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { personId, content } = await request.json();

  const { data: person } = await supabase
    .from("people")
    .select("id")
    .eq("id", personId)
    .eq("user_id", user.id)
    .single();
  if (!person) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Only save if no messages exist yet
  const { count } = await supabase
    .from("messages")
    .select("*", { count: "exact", head: true })
    .eq("person_id", personId);

  if (count && count > 0) {
    // Already has messages, return the first one
    const { data: first } = await supabase
      .from("messages")
      .select("*")
      .eq("person_id", personId)
      .order("created_at", { ascending: true })
      .limit(1)
      .single();
    return NextResponse.json({ message: first });
  }

  const { data } = await supabase
    .from("messages")
    .insert({ person_id: personId, user_id: user.id, role: "assistant", content })
    .select()
    .single();

  return NextResponse.json({ message: data });
}
