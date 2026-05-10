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
      fetch("/api/chat/opening", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ personId: person.id, content: opening }),
      })
        .then((r) => r.json())
        .then((data) => {
          if (data.message) setMessages([data.message]);
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
    if (textareaRef.current) textareaRef.current.style.height = "auto";
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
        return [...withoutTemp, { ...tempUserMsg, id: data.userMessageId ?? tempUserMsg.id }, data.message];
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

  const timeline: TimelineItem[] = [
    ...messages.map((m) => ({ type: "message" as const, ts: m.created_at, data: m })),
    ...summaries.map((s) => ({ type: "summary" as const, ts: s.created_at, data: s })),
  ].sort((a, b) => new Date(a.ts).getTime() - new Date(b.ts).getTime());

  let lastDateStr = "";

  return (
    <div className="h-dvh w-full overflow-hidden flex flex-col" style={{ background: "linear-gradient(160deg, #F5E0D0 0%, #F7EDE4 40%, #FAF0E8 100%)" }}>
      {/* Header */}
      <div className="px-4 pt-3 pb-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <button
            onClick={() => router.push("/home")}
            className="w-9 h-9 rounded-full bg-white/60 backdrop-blur flex items-center justify-center text-navy text-[18px] border border-white/80 shadow-sm"
          >
            ‹
          </button>
          <div className="ml-1">
            <p className="text-[11px] text-muted font-medium uppercase tracking-wider">talking about</p>
            <h1 className="font-sans text-[20px] font-semibold text-navy leading-tight">{person.name}</h1>
          </div>
        </div>
        <button
          onClick={() => {
            if (messages.filter((m) => !m.hidden).length < 2) { setToast("Start a conversation first."); return; }
            if (busy) { setToast("Haven will be ready shortly."); return; }
            setScopeOpen(true);
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/60 backdrop-blur border border-white/80 shadow-sm text-[12px] text-navy/70 font-medium"
        >
          <span className="text-gold">◎</span> Summary
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden px-4 py-2 flex flex-col gap-1">
        {timeline.map((item, i) => {
          const itemDate = new Date(item.ts).toDateString();
          const showSep = itemDate !== lastDateStr;
          const label = showSep ? formatDateLabel(item.ts) : null;
          lastDateStr = itemDate;

          return (
            <div key={`${item.type}-${(item.data as Message | Summary).id}-${i}`}>
              {label && (
                <div className="flex items-center gap-2 py-4">
                  <div className="flex-1 h-px bg-peach-dark/40" />
                  <span className="text-[11px] text-muted/70 whitespace-nowrap">{label}</span>
                  <div className="flex-1 h-px bg-peach-dark/40" />
                </div>
              )}

              {item.type === "message" ? (
                (item.data as Message).role === "user" ? (
                  /* User bubble — right-aligned pill */
                  <div className="flex justify-end mb-1 animate-fadein">
                    <div className="max-w-[78%] bg-navy text-white px-4 py-2.5 rounded-[20px] rounded-br-[6px] shadow-sm">
                      <p className="text-[15px] leading-[1.6]">{(item.data as Message).content}</p>
                    </div>
                  </div>
                ) : (
                  /* Haven response — left-aligned, conversational */
                  <div className="flex items-start gap-2.5 mb-2 animate-fadein">
                    <div className="w-7 h-7 rounded-full bg-gold/20 border border-gold/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-gold text-[11px]">◈</span>
                    </div>
                    <div className="max-w-[82%] bg-white/70 backdrop-blur px-4 py-2.5 rounded-[20px] rounded-tl-[6px] shadow-sm border border-white/80">
                      <p className="text-[15px] leading-[1.65] text-navy">{(item.data as Message).content}</p>
                    </div>
                  </div>
                )
              ) : (
                <SummaryCard
                  summary={item.data as Summary}
                  onView={(text) => { setSummaryText(text); setSummaryLabel(person.name); setSummaryOpen(true); }}
                />
              )}
            </div>
          );
        })}

        {/* Typing indicator */}
        {busy && (
          <div className="flex items-start gap-2.5 mb-2 animate-fadein">
            <div className="w-7 h-7 rounded-full bg-gold/20 border border-gold/30 flex items-center justify-center flex-shrink-0">
              <span className="text-gold text-[11px]">◈</span>
            </div>
            <div className="bg-white/70 backdrop-blur px-4 py-3 rounded-[20px] rounded-tl-[6px] shadow-sm border border-white/80 flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-muted dot-pulse" />
              <div className="w-1.5 h-1.5 rounded-full bg-muted dot-pulse" />
              <div className="w-1.5 h-1.5 rounded-full bg-muted dot-pulse" />
            </div>
          </div>
        )}

        {pendingSuggestions.length > 0 && (
          <SuggestionCard
            key={suggestionKey}
            suggestions={pendingSuggestions}
            onSave={saveSuggestions}
          />
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div
        className="flex-shrink-0 px-4 pt-2"
        style={{ paddingBottom: "calc(16px + env(safe-area-inset-bottom, 0px))" }}
      >
        <div className="flex items-end gap-2 bg-white/80 backdrop-blur rounded-[24px] border border-white shadow-md px-4 py-2">
          <textarea
            ref={textareaRef}
            rows={1}
            placeholder="Talk to Haven…"
            value={input}
            onChange={(e) => { setInput(e.target.value); resizeTextarea(); }}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
            className="flex-1 border-none resize-none text-[16px] text-navy font-sans bg-transparent leading-[1.5] min-h-[28px] max-h-[120px] overflow-y-auto placeholder-muted/60 py-1"
          />
          <button
            onClick={send}
            disabled={!input.trim() || busy}
            className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 mb-0.5 transition-all ${
              input.trim() && !busy ? "bg-navy text-white shadow-sm" : "bg-mid/60 text-muted cursor-default"
            }`}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8 13V3M8 3L4 7M8 3L12 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Summary scope sheet */}
      <Sheet open={scopeOpen} onClose={() => setScopeOpen(false)}>
        <h2 className="text-[15px] font-semibold text-navy mb-4 px-5">What would you like summarised?</h2>
        <div className="flex gap-2.5 px-5 mb-3">
          <button onClick={() => generateSummary("this")} className="flex-1 py-3.5 bg-cream border border-mid rounded-[14px] text-[14px] font-medium text-navy font-sans cursor-pointer">
            This conversation
          </button>
          <button onClick={() => generateSummary("all")} className="flex-1 py-3.5 bg-cream border border-mid rounded-[14px] text-[14px] font-medium text-navy font-sans cursor-pointer">
            All conversations
          </button>
        </div>
        <button onClick={() => setScopeOpen(false)} className="w-full py-2.5 bg-transparent border-none text-[14px] text-muted font-sans cursor-pointer" style={{ paddingBottom: "calc(16px + env(safe-area-inset-bottom, 0px))" }}>
          Cancel
        </button>
      </Sheet>

      <SummaryView open={summaryOpen} label={summaryLabel} text={summaryText} loading={summaryLoading} onClose={() => setSummaryOpen(false)} />

      {toast && <Toast message={toast} onDone={() => setToast("")} />}
    </div>
  );
}
