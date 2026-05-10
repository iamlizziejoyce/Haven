import type { ProfileInsight, Message, Person } from "./types";

export function buildSystemPrompt(
  userName: string,
  personName: string,
  insights: ProfileInsight[],
  otherConversations: { personName: string; lastAssistantMessage: string }[],
  linkedInsights?: { category: string; text: string }[]
): string {
  let prompt = `You are Haven, a warm and honest relationship-aware companion for ${userName}. You are in a conversation about "${personName}".

Speak in natural flowing sentences. No bullet points. Ask only one question at a time. Be warm but not soft — like a skilled therapist who knows the user well and is genuinely on their side, while being honest about things they might not want to hear. Avoid therapy clichés.`;

  if (insights.length > 0) {
    const grouped: Record<string, string[]> = {};
    insights.forEach((i) => {
      if (!grouped[i.category]) grouped[i.category] = [];
      grouped[i.category].push(i.text);
    });
    prompt += `\n\nWhat Haven knows about ${userName}:\n`;
    Object.entries(grouped).forEach(([cat, texts]) => {
      prompt += `${cat}: ${texts.join("; ")}\n`;
    });
  }

  if (otherConversations.length > 0) {
    prompt += `\n\nContext from other conversations:\n`;
    otherConversations.forEach((c) => {
      prompt += `In the conversation about "${c.personName}": ${c.lastAssistantMessage.substring(0, 200)}\n`;
    });
    prompt += `\nWhen relevant, explicitly reference these: "In your conversation about [person] you mentioned..."`;
  }

  if (linkedInsights && linkedInsights.length > 0) {
    const grouped: Record<string, string[]> = {};
    linkedInsights.forEach((i) => {
      if (!grouped[i.category]) grouped[i.category] = [];
      grouped[i.category].push(i.text);
    });
    prompt += `\n\n${personName} is also a Haven user and has consented to share context. Haven has observed these patterns about ${personName} from their own conversations:\n`;
    Object.entries(grouped).forEach(([cat, texts]) => {
      prompt += `${cat}: ${texts.join("; ")}\n`;
    });
    prompt += `Use this to inform your understanding of the relationship. Weave it in naturally — never quote it directly, never tell ${userName} that ${personName} "said" anything specific, and only reference it when genuinely relevant.`;
  }

  prompt += `\n\nPROFILE DETECTION: If something genuinely significant has emerged about ${userName}, end your response with:
PROFILE_SUGGESTION:{"category":"Communication|Triggers|Needs|Strengths|Patterns|Values|Other","text":"one clear sentence about ${userName}"}
Only when genuinely meaningful. Otherwise omit entirely.`;

  return prompt;
}

export function parseProfileSuggestion(raw: string): {
  reply: string;
  suggestion: { category: string; text: string } | null;
} {
  const marker = "PROFILE_SUGGESTION:";
  const idx = raw.indexOf(marker);
  if (idx === -1) return { reply: raw.trim(), suggestion: null };

  const reply = raw.substring(0, idx).trim();
  try {
    const suggestion = JSON.parse(raw.substring(idx + marker.length).trim());
    if (suggestion?.category && suggestion?.text) {
      return { reply, suggestion };
    }
  } catch {}
  return { reply, suggestion: null };
}

export function buildApiMessages(messages: Message[]) {
  // Keep last 80 messages to stay within context limits
  const recent = messages.slice(-80);

  return recent
    .map((m) => {
      const content = m.hidden
        ? `[Context from a previous conversation summary: ${m.content}]`
        : m.content;
      return { role: m.role as "user" | "assistant", content };
    })
    .filter((m) => m.content.trim().length > 0); // drop empty messages that cause API errors
}
