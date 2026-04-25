import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { personId } = await request.json();

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .single();
  const userName = profile?.display_name ?? "there";

  const { data: msgs } = await supabase
    .from("messages")
    .select("role, content")
    .eq("person_id", personId)
    .order("created_at", { ascending: true });

  const { data: existing } = await supabase
    .from("profile_insights")
    .select("text")
    .eq("user_id", user.id);

  const existingTexts = (existing ?? []).map((i) => i.text).join("; ");

  const messages: { role: "user" | "assistant"; content: string }[] = (msgs ?? []).map((m) => ({
    role: m.role as "user" | "assistant",
    content: m.content,
  }));

  messages.push({
    role: "user",
    content: `Identify 2-3 meaningful characteristics about ${userName} worth saving. Do not repeat: [${existingTexts}]. Return raw JSON only: {"suggestions":[{"category":"Communication|Triggers|Needs|Strengths|Patterns|Values|Other","text":"one clear sentence"}]}. If nothing new: {"suggestions":[]}`,
  });

  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 400,
      system: "Identify personal characteristics. Return JSON only, no other text.",
      messages,
    });

    const raw = response.content
      .filter((b) => b.type === "text")
      .map((b) => (b as { type: "text"; text: string }).text)
      .join("")
      .trim();

    const parsed = JSON.parse(raw);
    return NextResponse.json(parsed);
  } catch {
    return NextResponse.json({ suggestions: [] });
  }
}
