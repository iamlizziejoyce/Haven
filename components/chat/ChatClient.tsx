"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { Message, Summary, Person } from "@/lib/types";
import SummaryCard from "./SummaryCard";
import SuggestionCard from "./SuggestionCard";
import SummaryView from "./SummaryView";
import Toast from "@/components/ui/Toast";
import Sheet from "@/components/ui/Sheet";

interface TimelineItem {
  type: "message" | "summary";
  ts: string;
  data: Message | Summary;
}

interface Props {
  person: Person;
  displayName: string;
  initialMessages: Message[];
  initialSummaries: Summary[];
}

function formatDateLabel(ts: string) {
  const d = new Date(ts);
  const today = new Date();
  const yest = new Date(today);
  yest.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return null;
  if (d.toDateString() === yest.toDateString()) return "Yesterday";
  return d.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });
}

export default function ChatClient({ person, displayName, initialMessages, initialSummaries }: Props) {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [summaries, setSummaries] = useState<Summary[]>(initialSummaries);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState("");
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [summaryText, setSummaryText] = useState("");
  const [summaryLabel, setSummaryLabel] = useState("");
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [scopeOpen, setScopeOpen] = useState(false);
  const [pendingSuggestions, setPendingSuggestions] = useState<
    { category: string; text: string; checked: boolean }[]
  >([]);
  const [suggestionKey, setSuggestionKey] = useState(0);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-send opening message if no messages yet
  useEffect(() => {
    if (initialMessages.length === 0) {
      const opening = `Hello. I'm Haven. What's brought you here to talk about ${person.name} today?`;
      const ts = new Date().toISOString();
      const tempMsg: Message = {
        id: "opening",
        person_id: person.id,
        user_id: "",
        role: "assistant",
        content: opening,
        hidden: false,
        created_at: ts,
      };
      setMessages([tempMsg]);
      // Persist it
      fetch("/api/chat/opening", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ personId: person.id, content: opening }),
      }).then((r) => r.json()).then((data) => {
        if (data.message) {
          setMessages([data.message]);
        }
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, summaries, busy, scrollToBottom]);

  function resizeTextarea() {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 120) + "px";
  }

  async function send() {
    const text = input.trim();
    if (!text || busy) return;
    setInput("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
    setBusy(true);

    const tempUserMsg: Message = {
      id: `temp-u-${Date.now()}`,
      person_id: person.id,
      user_id: "",
      role: "user",
      content: text,
      hidden: false,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ personId: person.id, content: text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Request failed");

      setMessages((prev) => {
        const withoutTemp = prev.filter((m) => m.id !== tempUserMsg.id);
        const userMsg: Message = {
          ...tempUserMsg,
          id: data.userMessageId ?? tempUserMsg.id,
        };
        return [...withoutTemp, userMsg, data.message];
      });
    } catch (err) {
      setMessages((prev) => prev.filter((m) => m.id !== tempUserMsg.id));
      setToast(err instanceof Error ? err.message : "Something went wrong.");
    }
    setBusy(false);
    setTimeout(() => textareaRef.current?.focus(), 50);
  }

  async function generateSummary(scope: "this" | "all") {
    setScopeOpen(false);
    setSummaryLoading(true);
    setSummaryText("");
    setSummaryLabel(scope === "all" ? "All conversations" : person.name);
    setSummaryOpen(true);

    try {
      const res = await fetch("/api/summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ personId: person.id, scope }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Request failed");
      setSummaryText(data.summary);
      if (data.saved) {
        setSummaries((prev) => [...prev, data.saved]);
        // Trigger profile suggestions after summary
        fetchProfileSuggestions();
      }
    } catch (err) {
      setSummaryText("Something went wrong. Please try again.");
      setToast(err instanceof Error ? err.message : "Error generating summary.");
    }
    setSummaryLoading(false);
  }

  async function fetchProfileSuggestions() {
    try {
      const res = await fetch("/api/profile-suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ personId: person.id }),
      });
      const data = await res.json();
      if (data.suggestions?.length) {
        setPendingSuggestions(data.suggestions.map((s: { category: string; text: string }) => ({ ...s, checked: false })));
        setSuggestionKey((k) => k + 1);
      }
    } catch {}
  }

  async function saveSuggestions(selected: { category: string; text: string }[]) {
    for (const s of selected) {
      await fetch("/api/insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(s),
      });
    }
    setPendingSuggestions([]);
  }

  // Build timeline: merge messages and summaries, sort by created_at
  const timeline: TimelineItem[] = [
    ...messages.map((m) => ({ type: "message" as const, ts: m.created_at, data: m })),
    ...summaries.map((s) => ({ type: "summary" as const, ts: s.created_at, data: s })),
  ].sort((a, b) => new Date(a.ts).getTime() - new Date(b.ts).getTime());

  // Date separators
  let lastDateStr = "";

  return (
    <div className="h-dvh w-full overflow-hidden bg-cream flex flex-col">
      {/* Header */}
      <div className="px-3.5 py-3 bg-dark flex items-center justify-between flex-shrink-0 w-full">
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            onClick={() => router.push("/home")}
            className="bg-transparent border-none text-gold text-[22px] cursor-pointer p-0 leading-none flex-shrink-0"
          >
            ‹
          </button>
          <button
            onClick={() => router.push("/home")}
            className="font-serif text-white text-[16px] font-semibold tracking-[1px] cursor-pointer bg-transparent border-none p-0"
          >
            {person.name}
          </button>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button
            onClick={() => {
              if (messages.filter((m) => !m.hidden).length < 2) {
                setToast("Start a conversation first.");
                return;
              }
              if (busy) {
                setToast("Haven will be ready shortly.");
                return;
              }
              setScopeOpen(true);
            }}
            className="bg-transparent border border-white/20 text-[#6A8AAA] text-[10px] font-sans px-2.5 py-1.5 rounded-[12px] cursor-pointer"
          >
            ◎ summary
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden flex flex-col w-full">
        {timeline.map((item, i) => {
          const itemDate = new Date(item.ts).toDateString();
          const showSep = itemDate !== lastDateStr;
          const label = showSep ? formatDateLabel(item.ts) : null;
          lastDateStr = itemDate;

          return (
            <div key={`${item.type}-${(item.data as Message | Summary).id}-${i}`}>
              {label && (
                <div className="w-full px-4 py-3.5 flex items-center gap-2.5">
                  <div className="flex-1 h-px bg-mid" />
                  <span className="text-[11px] text-muted whitespace-nowrap">{label}</span>
                  <div className="flex-1 h-px bg-mid" />
                </div>
              )}
              {item.type === "message" ? (
                <div
                  className={`w-full px-4 py-2.5 flex flex-col gap-0.5 animate-fadein ${
                    (item.data as Message).role === "assistant" ? "bg-white" : "bg-cream"
                  }`}
                >
                  <div
                    className={`text-[11px] font-semibold tracking-[0.5px] uppercase mb-1 ${
                      (item.data as Message).role === "assistant" ? "text-gold" : "text-navy/50"
                    }`}
                  >
                    {(item.data as Message).role === "assistant" ? "Haven" : displayName}
                  </div>
                  <p className="text-[15px] leading-[1.65] text-navy w-full">
                    {(item.data as Message).content}
                  </p>
                </div>
              ) : (
                <SummaryCard
                  summary={item.data as Summary}
                  onView={(text) => {
                    setSummaryText(text);
                    setSummaryLabel(person.name);
                    setSummaryOpen(true);
                  }}
                />
              )}
            </div>
          );
        })}

        {/* Typing indicator */}
        {busy && (
          <div className="w-full px-4 py-2.5 bg-white flex items-center gap-1.5">
            <span className="text-[11px] font-semibold text-gold uppercase tracking-[0.5px] mr-1.5">Haven</span>
            <div className="w-1.5 h-1.5 rounded-full bg-sage dot-pulse" />
            <div className="w-1.5 h-1.5 rounded-full bg-sage dot-pulse" />
            <div className="w-1.5 h-1.5 rounded-full bg-sage dot-pulse" />
          </div>
        )}

        {/* Profile suggestion card */}
        {pendingSuggestions.length > 0 && (
          <SuggestionCard
            key={suggestionKey}
            suggestions={pendingSuggestions}
            onSave={saveSuggestions}
          />
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div
        className="flex-shrink-0 w-full px-3 pt-2.5 bg-white border-t border-mid"
        style={{ paddingBottom: "calc(12px + env(safe-area-inset-bottom, 0px))" }}
      >
        <div className="w-full border border-mid rounded-[12px] bg-cream flex flex-col">
          <textarea
            ref={textareaRef}
            rows={1}
            placeholder="Message Haven…"
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              resizeTextarea();
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            className="block w-full px-3.5 pt-3 pb-1.5 border-none resize-none text-[16px] text-navy font-sans bg-transparent leading-[1.5] min-h-[44px] max-h-[120px] overflow-y-auto placeholder-muted"
          />
          <div className="flex items-center justify-end px-2 pb-2">
            <button
              onClick={send}
              disabled={!input.trim() || busy}
              className={`w-[34px] h-[34px] rounded-[8px] border-none text-[16px] flex items-center justify-center transition-all ${
                input.trim() && !busy ? "bg-navy text-white cursor-pointer" : "bg-mid text-white cursor-default"
              }`}
            >
              ↑
            </button>
          </div>
        </div>
      </div>

      {/* Summary scope sheet */}
      <Sheet open={scopeOpen} onClose={() => setScopeOpen(false)}>
        <h2 className="text-[15px] font-semibold text-navy mb-4 px-5">What would you like summarised?</h2>
        <div className="flex gap-2.5 px-5 mb-3">
          <button
            onClick={() => generateSummary("this")}
            className="flex-1 py-3.5 bg-cream border border-mid rounded-[10px] text-[14px] font-medium text-navy font-sans cursor-pointer"
          >
            This conversation
          </button>
          <button
            onClick={() => generateSummary("all")}
            className="flex-1 py-3.5 bg-cream border border-mid rounded-[10px] text-[14px] font-medium text-navy font-sans cursor-pointer"
          >
            All conversations
          </button>
        </div>
        <button
          onClick={() => setScopeOpen(false)}
          className="w-full py-2.5 bg-transparent border-none text-[14px] text-muted font-sans cursor-pointer"
          style={{ paddingBottom: "calc(16px + env(safe-area-inset-bottom, 0px))" }}
        >
          Cancel
        </button>
      </Sheet>

      {/* Summary view */}
      <SummaryView
        open={summaryOpen}
        label={summaryLabel}
        text={summaryText}
        loading={summaryLoading}
        onClose={() => setSummaryOpen(false)}
      />

      {toast && <Toast message={toast} onDone={() => setToast("")} />}
    </div>
  );
}
