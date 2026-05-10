"use client";

import { useState } from "react";

interface Suggestion {
  category: string;
  text: string;
  checked: boolean;
}

interface Props {
  suggestions: Suggestion[];
  onSave: (selected: { category: string; text: string }[]) => void;
}

export default function SuggestionCard({ suggestions: initial, onSave }: Props) {
  const [items, setItems] = useState(initial);
  const [saved, setSaved] = useState(false);
  const [count, setCount] = useState(0);

  function toggle(idx: number) {
    setItems((prev) => prev.map((s, i) => (i === idx ? { ...s, checked: !s.checked } : s)));
  }

  function handleSave() {
    const selected = items.filter((s) => s.checked);
    setCount(selected.length);
    onSave(selected);
    setSaved(true);
  }

  if (saved) {
    return (
      <div className="flex justify-center my-2 animate-fadein">
        <div className="bg-white/70 backdrop-blur border border-white/80 rounded-[18px] px-4 py-3 shadow-sm max-w-[85%]">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-gold text-[12px]">◈</span>
            <span className="text-[11px] font-semibold text-gold uppercase tracking-wider">Profile updated</span>
          </div>
          <p className="text-[13px] text-navy">{count > 0 ? `${count} insight${count > 1 ? "s" : ""} saved.` : "Nothing saved."}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-center my-2 animate-fadein">
      <div className="bg-white/70 backdrop-blur border border-white/80 rounded-[18px] px-4 py-3 shadow-sm w-[85%]">
        <div className="flex items-center gap-1.5 mb-1.5">
          <span className="text-gold text-[12px]">◈</span>
          <span className="text-[11px] font-semibold text-gold uppercase tracking-wider">Profile suggestions</span>
        </div>
        <p className="text-[12px] text-muted mb-3">Based on this conversation. Tap to select, then save.</p>
        {items.map((s, i) => (
          <div key={i} className={`flex items-start gap-2.5 py-2 ${i < items.length - 1 ? "border-b border-peach-dark/30" : "mb-2"}`}>
            <button
              onClick={() => toggle(i)}
              className={`w-5 h-5 rounded-full border-[1.5px] flex-shrink-0 flex items-center justify-center text-[10px] text-white transition-all cursor-pointer ${
                s.checked ? "bg-sage border-sage" : "bg-peach border-peach-dark"
              }`}
            >
              {s.checked ? "✓" : ""}
            </button>
            <div>
              <div className="text-[10px] font-semibold text-sage uppercase tracking-wider mb-0.5">{s.category}</div>
              <p className="text-[13px] text-navy leading-[1.5]">{s.text}</p>
            </div>
          </div>
        ))}
        <button
          onClick={handleSave}
          className="w-full py-2 rounded-[10px] border-none bg-navy text-white text-[13px] font-semibold font-sans cursor-pointer mt-1"
        >
          Save selected
        </button>
      </div>
    </div>
  );
}
