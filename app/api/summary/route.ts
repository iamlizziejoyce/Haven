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

  const { personId, scope } = await request.json();

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .single();
  const userName = profile?.display_name ?? "there";

  let apiMessages: { role: "user" | "assistant"; content: string }[] = [];
  let labelName = "";

  if (scope === "all") {
    const { data: people } = await supabase
      .from("people")
      .select("id, name")
      .eq("user_id", user.id);
    if (!people?.length) {
      return NextResponse.json({ error: "No conversations found" }, { status: 400 });
    }
    labelName = "All conversations";
    for (const p of people) {
      const { data: msgs } = await supabase
        .from("messages")
        .select("role, content")
        .eq("person_id", p.id)
        .order("created_at", { ascending: true });
      if (msgs?.length) {
        const transcript = msgs
          .map((m) => `${m.role === "user" ? userName : "Haven"}: ${m.content}`)
          .join("\n");
        apiMessages.push({ role: "user", content: `Conversation about "${p.name}":\n${transcript}` });
      }
    }
    apiMessages.push({
      role: "user",
      content:
        "Based on all conversations above, provide a summary focused on actionable insights and next steps. Draw connections across relationships. Be specific. Flowing paragraphs only.",
    });
  } else {
    if (!personId) return NextResponse.json({ error: "Missing personId" }, { status: 400 });
    const { data: person } = await supabase
      .from("people")
      .select("name")
      .eq("id", personId)
      .eq("user_id", user.id)
      .single();
    if (!person) return NextResponse.json({ error: "Not found" }, { status: 404 });
    labelName = person.name;

    const { data: msgs } = await supabase
      .from("messages")
      .select("role, content")
      .eq("person_id", personId)
      .order("created_at", { ascending: true });
    if (!msgs?.length) {
      return NextResponse.json({ error: "No messages to summarise" }, { status: 400 });
    }
    apiMessages = msgs.map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));
    apiMessages.push({
      role: "user",
      content:
        "Summarise this conversation with a focus on actionable insights and clear next steps. Be specific. Flowing paragraphs, not bullet points.",
    });
  }

  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 1500,
      system: `You are Haven generating a summary for ${userName}. Write in flowing paragraphs with actionable insights.`,
      messages: apiMessages,
    });

    const summaryText = response.content
      .filter((b) => b.type === "text")
      .map((b) => (b as { type: "text"; text: string }).text)
      .join("")
      .trim();

    // Save summary to DB (only for single-person scope)
    let savedSummary = null;
    if (scope !== "all" && personId) {
      const { data } = await supabase
        .from("summaries")
        .insert({ person_id: personId, user_id: user.id, content: summaryText })
        .select()
        .single();
      savedSummary = data;
    }

    return NextResponse.json({ summary: summaryText, saved: savedSummary, label: labelName });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
