"use client";

import type { Summary } from "@/lib/types";

interface Props {
  summary: Summary;
  onView: (text: string) => void;
}

function formatTime(ts: string) {
  const d = new Date(ts);
  return (
    d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }) +
    " · " +
    d.toLocaleDateString("en-GB", { day: "numeric", month: "short" })
  );
}

export default function SummaryCard({ summary, onView }: Props) {
  return (
    <div className="flex justify-center my-2 animate-fadein">
      <button
        onClick={() => onView(summary.content)}
        className="max-w-[85%] bg-white/70 backdrop-blur border border-white/80 rounded-[18px] px-4 py-3 shadow-sm text-left active:bg-white/90 transition-colors"
      >
        <div className="flex items-center gap-1.5 mb-1.5">
          <span className="text-gold text-[12px]">◎</span>
          <span className="text-[11px] font-semibold text-gold uppercase tracking-wider">Summary</span>
          <span className="text-[10px] text-muted ml-auto pl-2">{formatTime(summary.created_at)}</span>
        </div>
        <p className="text-[13px] text-navy/70 leading-[1.5] line-clamp-2">{summary.content}</p>
        <p className="text-[11px] text-gold mt-1.5 font-medium">Tap to view →</p>
      </button>
    </div>
  );
}
