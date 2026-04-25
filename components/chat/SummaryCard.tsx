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
    <div className="w-full px-4 py-2 animate-fadein">
      <div
        onClick={() => onView(summary.content)}
        className="bg-white border border-mid border-l-[3px] border-l-gold rounded-[10px] px-3.5 py-3 cursor-pointer active:bg-[#F0EDE8]"
      >
        <div className="flex items-center justify-between mb-1">
          <span className="text-[12px] font-bold text-gold tracking-[0.5px] uppercase">◎ Summary</span>
          <span className="text-[11px] text-muted">{formatTime(summary.created_at)}</span>
        </div>
        <p className="text-[13px] text-navy leading-[1.5] opacity-70 line-clamp-2">{summary.content}</p>
        <p className="text-[11px] text-gold mt-2 font-medium">Tap to view →</p>
      </div>
    </div>
  );
}
