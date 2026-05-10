import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import {
  buildSystemPrompt,
  parseProfileSuggestion,
  buildApiMessages,
} from "@/lib/system-prompt";
import type { Message } from "@/lib/types";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { personId, content } = await request.json();
  if (!personId || !content?.trim()) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  // Verify person belongs to user
  const { data: person } = await supabase
    .from("people")
    .select("*")
    .eq("id", personId)
    .eq("user_id", user.id)
    .single();
  if (!person) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .single();
  const userName = profile?.display_name ?? "there";

  // Save user message
  const { data: userMsg } = await supabase
    .from("messages")
    .insert({ person_id: personId, user_id: user.id, role: "user", content })
    .select()
    .single();
  if (!userMsg) return NextResponse.json({ error: "Failed to save message" }, { status: 500 });

  // Update person updated_at
  await supabase.from("people").update({ updated_at: new Date().toISOString() }).eq("id", personId);

  // Load full message history for this person
  const { data: messages } = await supabase
    .from("messages")
    .select("*")
    .eq("person_id", personId)
    .order("created_at", { ascending: true });

  // Load user's profile insights
  const { data: insights } = await supabase
    .from("profile_insights")
    .select("*")
    .eq("user_id", user.id);

  // Load last message from other conversations for cross-context
  const { data: otherPeople } = await supabase
    .from("people")
    .select("id, name")
    .eq("user_id", user.id)
    .neq("id", personId);

  const otherConversations: { personName: string; lastAssistantMessage: string }[] = [];
  if (otherPeople) {
    for (const op of otherPeople) {
      const { data: lastMsg } = await supabase
        .from("messages")
        .select("content")
        .eq("person_id", op.id)
        .eq("role", "assistant")
        .order("created_at", { ascending: false })
        .limit(1)
        .single();
      if (lastMsg) {
        otherConversations.push({ personName: op.name, lastAssistantMessage: lastMsg.content });
      }
    }
  }

  // Check for linked account whose display_name matches person.name
  let linkedInsights: { category: string; text: string }[] = [];
  const { data: links } = await supabase
    .from("account_links")
    .select("requester_id, recipient_id")
    .or(`requester_id.eq.${user.id},recipient_id.eq.${user.id}`)
    .eq("status", "accepted");

  if (links?.length) {
    for (const link of links) {
      const linkedUserId = link.requester_id === user.id ? link.recipient_id : link.requester_id;
      const { data: linkedProfile } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("id", linkedUserId)
        .single();
      if (linkedProfile?.display_name?.toLowerCase() === person.name.toLowerCase()) {
        const { data: li } = await supabase
          .from("profile_insights")
          .select("category, text")
          .eq("user_id", linkedUserId);
        linkedInsights = li ?? [];
        break;
      }
    }
  }

  const systemPrompt = buildSystemPrompt(
    userName,
    person.name,
    insights ?? [],
    otherConversations,
    linkedInsights.length ? linkedInsights : undefined
  );

  const apiMessages = buildApiMessages((messages ?? []) as Message[]);

  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 1000,
      system: systemPrompt,
      messages: apiMessages,
    });

    const raw = response.content
      .filter((b) => b.type === "text")
      .map((b) => (b as { type: "text"; text: string }).text)
      .join("")
      .trim();

    const { reply, suggestion } = parseProfileSuggestion(raw);

    // Save assistant message
    const { data: assistantMsg } = await supabase
      .from("messages")
      .insert({ person_id: personId, user_id: user.id, role: "assistant", content: reply })
      .select()
      .single();

    // Save profile suggestion if present
    if (suggestion) {
      const { data: existing } = await supabase
        .from("profile_insights")
        .select("id")
        .eq("user_id", user.id)
        .ilike("text", suggestion.text)
        .limit(1);
      if (!existing?.length) {
        await supabase.from("profile_insights").insert({
          user_id: user.id,
          category: suggestion.category,
          text: suggestion.text,
        });
      }
    }

    return NextResponse.json({
      message: assistantMsg,
      userMessageId: userMsg.id,
      profileUpdated: !!suggestion,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
