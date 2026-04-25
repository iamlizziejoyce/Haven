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
      <div className="w-full px-4 py-2 animate-fadein">
        <div className="bg-white border border-mid border-l-[3px] border-l-gold rounded-[10px] px-3.5 py-3">
          <div className="text-[10px] font-bold text-gold uppercase tracking-[0.5px] mb-1">◈ Profile updated</div>
          <p className="text-[13px] text-navy">
            {count > 0 ? `${count} insight${count > 1 ? "s" : ""} saved.` : "Nothing saved."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full px-4 py-2 animate-fadein">
      <div className="bg-white border border-mid border-l-[3px] border-l-gold rounded-[10px] px-3.5 py-3">
        <div className="text-[10px] font-bold text-gold uppercase tracking-[0.5px] mb-1.5">◈ Profile suggestions</div>
        <p className="text-[13px] text-muted mb-2.5">Based on this conversation. Tap to select, then save.</p>
        {items.map((s, i) => (
          <div key={i} className={`flex items-start gap-2.5 py-2 ${i < items.length - 1 ? "border-b border-mid" : "mb-2.5"}`}>
            <button
              onClick={() => toggle(i)}
              className={`w-[22px] h-[22px] rounded-full border-[1.5px] flex-shrink-0 flex items-center justify-center text-[11px] text-white transition-all cursor-pointer ${
                s.checked ? "bg-sage border-sage" : "bg-cream border-mid"
              }`}
            >
              {s.checked ? "✓" : ""}
            </button>
            <div>
              <div className="text-[10px] font-semibold text-sage uppercase tracking-[0.5px] mb-0.5">{s.category}</div>
              <p className="text-[13px] text-navy leading-[1.5]">{s.text}</p>
            </div>
          </div>
        ))}
        <button
          onClick={handleSave}
          className="w-full py-2.5 rounded-[8px] border-none bg-navy text-white text-[13px] font-semibold font-sans cursor-pointer"
        >
          Save selected
        </button>
      </div>
    </div>
  );
}
